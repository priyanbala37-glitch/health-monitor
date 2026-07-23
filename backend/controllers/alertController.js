const db = require('../config/db');

exports.getActiveAlerts = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.*, r.name AS resident_name, r.room_no
       FROM alerts a JOIN residents r ON a.resident_id = r.id
       WHERE a.resolved = FALSE ORDER BY a.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching alerts' });
  }
};

exports.resolveAlert = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE alerts SET resolved = TRUE WHERE id = ?', [id]);
    res.json({ message: 'Alert resolved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error resolving alert' });
  }
};

// Fall detection simulation — in a real deployment this would be triggered
// by a wearable's accelerometer; here staff can simulate it for the demo.
exports.triggerFallAlert = async (req, res) => {
  try {
    const { resident_id } = req.body;
    const [residentRows] = await db.query('SELECT name FROM residents WHERE id = ?', [resident_id]);
    if (residentRows.length === 0) return res.status(404).json({ message: 'Resident not found' });

    const message = `Fall detected — immediate check required`;
    const [alertResult] = await db.query(
      `INSERT INTO alerts (resident_id, type, message, severity) VALUES (?, 'fall', ?, 'high')`,
      [resident_id, message]
    );

    const io = req.app.get('io');
    if (io) {
      io.emit('new_alert', {
        id: alertResult.insertId, resident_id, resident_name: residentRows[0].name,
        type: 'fall', message, severity: 'high', created_at: new Date()
      });
    }

    res.status(201).json({ message: 'Fall alert triggered' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error triggering fall alert' });
  }
};