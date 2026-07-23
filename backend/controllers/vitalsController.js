const db = require('../config/db');
const { processVitalsReading } = require('../services/anomalyDetector');

exports.logVitals = async (req, res) => {
  try {
    const { resident_id, heart_rate, spo2, temperature, bp_systolic, bp_diastolic } = req.body;

    if (!resident_id) {
      return res.status(400).json({ message: 'resident_id is required' });
    }

    const [result] = await db.query(
      `INSERT INTO vitals_log (resident_id, heart_rate, spo2, temperature, bp_systolic, bp_diastolic)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [resident_id, heart_rate, spo2, temperature, bp_systolic, bp_diastolic]
    );

    const vitalsLogId = result.insertId;
    const io = req.app.get('io');

    const analysis = await processVitalsReading(
      vitalsLogId, resident_id,
      { heart_rate, spo2, temperature, bp_systolic, bp_diastolic },
      io
    );

    res.status(201).json({
      message: 'Vitals logged',
      vitalsId: vitalsLogId,
      aiAnalysis: analysis
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error logging vitals' });
  }
};

exports.getVitalsByResident = async (req, res) => {
  try {
    const { residentId } = req.params;
    const [rows] = await db.query(
      'SELECT * FROM vitals_log WHERE resident_id = ? ORDER BY recorded_at DESC',
      [residentId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching vitals' });
  }
};