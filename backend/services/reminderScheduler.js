const db = require('../config/db');

// How many minutes after the scheduled time before it's auto-marked missed.
// Keep this short (e.g. 1-2) while testing/demoing, and more realistic
// (e.g. 15-30) for a real deployment.
const GRACE_MINUTES = 1;

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Makes sure every resident has a medicine_log row for today, for every
// medicine they're scheduled. Runs on every scheduler tick so it works
// even if nobody opens the Medicine Tracker screen that day.
async function ensureTodayLogsForAllResidents() {
  const todayStr = formatDate(new Date());
  const [residents] = await db.query('SELECT id FROM residents');

  for (const r of residents) {
    const [medicines] = await db.query('SELECT id FROM medicines WHERE resident_id = ?', [r.id]);
    for (const med of medicines) {
      const [existing] = await db.query(
        'SELECT id FROM medicine_log WHERE medicine_id = ? AND scheduled_date = ?',
        [med.id, todayStr]
      );
      if (existing.length === 0) {
        await db.query(
          `INSERT INTO medicine_log (medicine_id, scheduled_date, status) VALUES (?, ?, 'pending')`,
          [med.id, todayStr]
        );
      }
    }
  }
}

// Finds every still-pending dose for today, and if the grace period has
// passed, marks it 'missed' and raises a real alert (broadcast live too).
async function checkOverdueMedicines(io) {
  try {
    await ensureTodayLogsForAllResidents();

    const [pending] = await db.query(
      `SELECT ml.id AS log_id, m.med_name, m.time_of_day, m.resident_id, r.name AS resident_name
       FROM medicine_log ml
       JOIN medicines m ON ml.medicine_id = m.id
       JOIN residents r ON m.resident_id = r.id
       WHERE ml.status = 'pending' AND ml.scheduled_date = CURDATE()`
    );

    const now = new Date();

    for (const row of pending) {
      const [h, m] = row.time_of_day.split(':').map(Number);
      const scheduled = new Date();
      scheduled.setHours(h, m, 0, 0);
      const graceDeadline = new Date(scheduled.getTime() + GRACE_MINUTES * 60000);

      if (now > graceDeadline) {
        await db.query(`UPDATE medicine_log SET status = 'missed', marked_at = NOW() WHERE id = ?`, [row.log_id]);

        const message = `Missed dose: ${row.med_name} (was due ${row.time_of_day.slice(0, 5)})`;
        const [alertResult] = await db.query(
          `INSERT INTO alerts (resident_id, type, message, severity) VALUES (?, 'missed_medicine', ?, 'medium')`,
          [row.resident_id, message]
        );

        if (io) {
          io.emit('new_alert', {
            id: alertResult.insertId,
            resident_id: row.resident_id,
            resident_name: row.resident_name,
            type: 'missed_medicine',
            message,
            severity: 'medium',
            created_at: new Date()
          });
        }

        console.log(`⏰ Auto-marked missed: ${row.med_name} for ${row.resident_name}`);
      }
    }
  } catch (err) {
    console.error('⚠️ Reminder scheduler tick failed, will retry in 60s:', err.message);
  }
}

// Call this once when the server starts. Waits 5s to let the DB proxy
// settle after boot, then repeats every 60 seconds for as long as the
// server is running. Errors inside a tick are caught above, so one bad
// connection blip never crashes the whole process.
function startReminderScheduler(io) {
  setTimeout(() => checkOverdueMedicines(io), 5000);
  setInterval(() => checkOverdueMedicines(io), 60 * 1000);
}

module.exports = { startReminderScheduler };