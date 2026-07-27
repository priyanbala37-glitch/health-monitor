const db = require('../config/db');

async function ensureLogsForDate(residentId, dateStr, isToday) {
  const [medicines] = await db.query('SELECT id FROM medicines WHERE resident_id = ?', [residentId]);
  for (const med of medicines) {
    const [existing] = await db.query(
      'SELECT id FROM medicine_log WHERE medicine_id = ? AND scheduled_date = ?',
      [med.id, dateStr]
    );
    if (existing.length === 0) {
      await db.query(
        `INSERT INTO medicine_log (medicine_id, scheduled_date, status) VALUES (?, ?, ?)`,
        [med.id, dateStr, isToday ? 'pending' : 'missed']
      );
    }
  }
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

exports.addMedicine = async (req, res) => {
  try {
    const { resident_id, med_name, dosage, time_of_day, frequency } = req.body;
    if (!resident_id || !med_name || !time_of_day) {
      return res.status(400).json({ message: 'resident_id, med_name, and time_of_day are required' });
    }
    const [result] = await db.query(
      `INSERT INTO medicines (resident_id, med_name, dosage, time_of_day, frequency) VALUES (?, ?, ?, ?, ?)`,
      [resident_id, med_name, dosage || null, time_of_day, frequency || 'daily']
    );
    res.status(201).json({ message: 'Medicine schedule added', medicineId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error adding medicine' });
  }
};

exports.getMedicinesByResident = async (req, res) => {
  try {
    const { residentId } = req.params;
    const [rows] = await db.query('SELECT * FROM medicines WHERE resident_id = ? ORDER BY time_of_day', [residentId]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching medicines' });
  }
};

// Update an existing medicine's name, dosage, time, or frequency.
// This changes the schedule going forward; today's log entry keeps its
// existing status, but the displayed name/time updates immediately.
exports.updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const { med_name, dosage, time_of_day, frequency } = req.body;

    if (!med_name || !time_of_day) {
      return res.status(400).json({ message: 'med_name and time_of_day are required' });
    }

    await db.query(
      `UPDATE medicines SET med_name = ?, dosage = ?, time_of_day = ?, frequency = ? WHERE id = ?`,
      [med_name, dosage || null, time_of_day, frequency || 'daily', id]
    );

    res.json({ message: 'Medicine updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating medicine' });
  }
};

// Deletes a medicine and its full log history.
exports.deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM medicine_log WHERE medicine_id = ?', [id]);
    await db.query('DELETE FROM medicines WHERE id = ?', [id]);
    res.json({ message: 'Medicine deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting medicine' });
  }
};

exports.getTodayLog = async (req, res) => {
  try {
    const { residentId } = req.params;
    const today = formatDate(new Date());
    await ensureLogsForDate(residentId, today, true);

    const [rows] = await db.query(
      `SELECT ml.id AS log_id, m.med_name, m.dosage, m.time_of_day, ml.status, ml.scheduled_date
       FROM medicine_log ml JOIN medicines m ON ml.medicine_id = m.id
       WHERE m.resident_id = ? AND ml.scheduled_date = ? ORDER BY m.time_of_day`,
      [residentId, today]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching today's log" });
  }
};

exports.markDoseStatus = async (req, res) => {
  try {
    const { logId } = req.params;
    const { status } = req.body;
    if (!['taken', 'missed'].includes(status)) {
      return res.status(400).json({ message: "status must be 'taken' or 'missed'" });
    }
    await db.query('UPDATE medicine_log SET status = ?, marked_at = NOW() WHERE id = ?', [status, logId]);

    if (status === 'missed') {
      const [rows] = await db.query(
        `SELECT m.resident_id, m.med_name, r.name AS resident_name
         FROM medicine_log ml JOIN medicines m ON ml.medicine_id = m.id JOIN residents r ON m.resident_id = r.id
         WHERE ml.id = ?`,
        [logId]
      );
      if (rows.length > 0) {
        const [alertResult] = await db.query(
          `INSERT INTO alerts (resident_id, type, message, severity) VALUES (?, 'missed_medicine', ?, 'medium')`,
          [rows[0].resident_id, `Missed dose: ${rows[0].med_name}`]
        );
        const io = req.app.get('io');
        if (io) {
          io.emit('new_alert', {
            id: alertResult.insertId, resident_id: rows[0].resident_id, resident_name: rows[0].resident_name,
            type: 'missed_medicine', message: `Missed dose: ${rows[0].med_name}`, severity: 'medium', created_at: new Date()
          });
        }
      }
    }
    res.json({ message: `Dose marked as ${status}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating dose status' });
  }
};

exports.getAdherenceStats = async (req, res) => {
  try {
    const { residentId } = req.params;
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = formatDate(d);
      await ensureLogsForDate(residentId, dateStr, i === 0);
    }

    const [rows] = await db.query(
      `SELECT ml.scheduled_date, SUM(ml.status = 'taken') AS taken, COUNT(*) AS total
       FROM medicine_log ml JOIN medicines m ON ml.medicine_id = m.id
       WHERE m.resident_id = ? AND ml.scheduled_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       GROUP BY ml.scheduled_date ORDER BY ml.scheduled_date`,
      [residentId]
    );

    const stats = rows.map((r) => ({
      date: r.scheduled_date,
      adherence: r.total > 0 ? Math.round((r.taken / r.total) * 100) : 0
    }));

    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching adherence stats' });
  }
};