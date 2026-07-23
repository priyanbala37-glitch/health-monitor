const db = require('../config/db');
const { askGemini } = require('../services/geminiService');

exports.ask = async (req, res) => {
  try {
    const { resident_id, question } = req.body;
    if (!resident_id || !question) {
      return res.status(400).json({ message: 'resident_id and question are required' });
    }

    const [residentRows] = await db.query('SELECT * FROM residents WHERE id = ?', [resident_id]);
    if (residentRows.length === 0) return res.status(404).json({ message: 'Resident not found' });
    const resident = residentRows[0];

    const [vitals] = await db.query(
      'SELECT * FROM vitals_log WHERE resident_id = ? ORDER BY recorded_at DESC LIMIT 5',
      [resident_id]
    );
    const [alerts] = await db.query(
      "SELECT * FROM alerts WHERE resident_id = ? AND resolved = FALSE ORDER BY created_at DESC",
      [resident_id]
    );
    const [medicines] = await db.query(
      'SELECT med_name, dosage, time_of_day FROM medicines WHERE resident_id = ?',
      [resident_id]
    );

    const prompt = `You are a clinical assistant helping nursing staff at an old age home understand a resident's condition. Be concise, practical, and never give a definitive diagnosis — suggest observations and next steps a nurse can take.

Resident: ${resident.name}, age ${resident.age}, known conditions: ${resident.conditions || 'none recorded'}.
Baseline vitals: HR ${resident.baseline_hr}bpm, SpO2 ${resident.baseline_spo2}%, Temp ${resident.baseline_temp}°F, BP ${resident.baseline_bp_sys}/${resident.baseline_bp_dia}.

Recent vitals log (most recent first): ${JSON.stringify(vitals)}
Active unresolved alerts: ${JSON.stringify(alerts)}
Medicine schedule: ${JSON.stringify(medicines)}

Staff question: "${question}"

Answer in 3-5 short sentences.`;

    const answer = await askGemini(prompt);
    res.json({ answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error getting assistant response' });
  }
};