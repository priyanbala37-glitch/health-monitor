const db = require('../config/db');

exports.addResident = async (req, res) => {
  try {
    const { name, age, gender, room_no, conditions, date_of_birth, hometown } = req.body;
    if (!name || !age) return res.status(400).json({ message: 'Name and age are required' });

    const [result] = await db.query(
      `INSERT INTO residents (name, age, gender, room_no, conditions, date_of_birth, hometown)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, age, gender || null, room_no || null, conditions || null, date_of_birth || null, hometown || null]
    );
    res.status(201).json({ message: 'Resident added', residentId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error adding resident' });
  }
};

exports.getAllResidents = async (req, res) => {
  try {
    const [residents] = await db.query('SELECT * FROM residents ORDER BY name');

    const withStatus = await Promise.all(
      residents.map(async (r) => {
        // Manual override always wins if set
        if (r.status_override && r.status_override !== 'auto') {
          return { ...r, status: r.status_override };
        }

        const [[{ highCount }]] = await db.query(
          `SELECT COUNT(*) AS highCount FROM alerts WHERE resident_id = ? AND resolved = FALSE AND severity = 'high'`,
          [r.id]
        );
        const [[{ medCount }]] = await db.query(
          `SELECT COUNT(*) AS medCount FROM alerts WHERE resident_id = ? AND resolved = FALSE AND severity = 'medium'`,
          [r.id]
        );

        let status = 'normal';
        if (highCount > 0) status = 'critical';
        else if (medCount > 0) status = 'watch';

        return { ...r, status };
      })
    );

    res.json(withStatus);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching residents' });
  }
};

exports.getResidentById = async (req, res) => {
  try {
    const { id } = req.params;
    const [residentRows] = await db.query('SELECT * FROM residents WHERE id = ?', [id]);
    if (residentRows.length === 0) return res.status(404).json({ message: 'Resident not found' });

    const [latestVitals] = await db.query(
      `SELECT * FROM vitals_log WHERE resident_id = ? ORDER BY recorded_at DESC LIMIT 5`,
      [id]
    );

    res.json({ resident: residentRows[0], recentVitals: latestVitals });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching resident' });
  }
};

exports.updateResident = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, age, gender, room_no, conditions, date_of_birth, hometown } = req.body;

    await db.query(
      `UPDATE residents SET name=?, age=?, gender=?, room_no=?, conditions=?, date_of_birth=?, hometown=? WHERE id=?`,
      [name, age, gender, room_no, conditions, date_of_birth || null, hometown || null, id]
    );

    res.json({ message: 'Resident profile updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating resident' });
  }
};

// Manually set (or clear) a resident's status
exports.setStatusOverride = async (req, res) => {
  try {
    const { id } = req.params;
    const { status_override } = req.body; // 'auto' | 'normal' | 'watch' | 'critical'

    if (!['auto', 'normal', 'watch', 'critical'].includes(status_override)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    await db.query('UPDATE residents SET status_override = ? WHERE id = ?', [status_override, id]);
    res.json({ message: 'Status updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating status' });
  }
};