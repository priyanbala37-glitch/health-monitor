const db = require('../config/db');

const HARD_LIMITS = {
  spo2_low: 92, hr_high: 120, hr_low: 50,
  temp_high: 100.4, bp_sys_high: 140, bp_dia_high: 90
};

function analyzeVitals(reading, baseline) {
  const reasons = [];
  let severity = 'low';

  if (reading.spo2 && reading.spo2 < HARD_LIMITS.spo2_low) {
    reasons.push(`Low oxygen saturation (SpO2: ${reading.spo2}%)`); severity = 'high';
  }
  if (reading.heart_rate && reading.heart_rate > HARD_LIMITS.hr_high) {
    reasons.push(`Elevated heart rate (${reading.heart_rate} bpm)`); severity = 'high';
  }
  if (reading.heart_rate && reading.heart_rate < HARD_LIMITS.hr_low) {
    reasons.push(`Low heart rate (${reading.heart_rate} bpm)`); severity = 'high';
  }
  if (reading.temperature && reading.temperature > HARD_LIMITS.temp_high) {
    reasons.push(`Fever detected (${reading.temperature}°F)`);
    severity = severity === 'high' ? 'high' : 'medium';
  }
  if (reading.bp_systolic && reading.bp_systolic > HARD_LIMITS.bp_sys_high) {
    reasons.push(`High blood pressure (${reading.bp_systolic}/${reading.bp_diastolic})`);
    severity = severity === 'high' ? 'high' : 'medium';
  }

  const deviation = (value, base, label, threshold = 0.15) => {
    if (!value || !base) return;
    const percentChange = Math.abs(value - base) / base;
    if (percentChange > threshold) {
      reasons.push(`${label} deviates ${(percentChange * 100).toFixed(0)}% from personal baseline (${value} vs usual ${base})`);
      if (severity === 'low') severity = 'medium';
    }
  };

  deviation(reading.heart_rate, baseline.baseline_hr, 'Heart rate');
  deviation(reading.spo2, baseline.baseline_spo2, 'SpO2', 0.05);
  deviation(reading.temperature, baseline.baseline_temp, 'Temperature', 0.03);
  deviation(reading.bp_systolic, baseline.baseline_bp_sys, 'Systolic BP');

  return { isAnomaly: reasons.length > 0, reason: reasons.join('; '), severity };
}

// PREDICTIVE LAYER: looks at the last 3 readings (including this one).
// If 2+ show a soft deviation from baseline — even if none crossed a hard
// limit individually — flag it as an early "trending" risk, before it
// becomes a critical event.
async function checkTrend(residentId, baseline) {
  const [recent] = await db.query(
    `SELECT heart_rate, spo2, temperature FROM vitals_log
     WHERE resident_id = ? ORDER BY recorded_at DESC LIMIT 3`,
    [residentId]
  );

  if (recent.length < 3) return null;

  const softDeviation = (value, base, threshold = 0.10) => {
    if (!value || !base) return false;
    return Math.abs(value - base) / base > threshold;
  };

  let driftingCount = 0;
  recent.forEach((r) => {
    const drifted =
      softDeviation(r.heart_rate, baseline.baseline_hr) ||
      softDeviation(r.spo2, baseline.baseline_spo2, 0.04) ||
      softDeviation(r.temperature, baseline.baseline_temp, 0.02);
    if (drifted) driftingCount += 1;
  });

  if (driftingCount >= 2) {
    return `Trending toward abnormal: ${driftingCount} of the last 3 readings drifted from personal baseline. Recommend closer observation.`;
  }
  return null;
}

async function processVitalsReading(vitalsLogId, residentId, reading, io) {
  const [residentRows] = await db.query(
    'SELECT name, baseline_hr, baseline_spo2, baseline_temp, baseline_bp_sys, baseline_bp_dia FROM residents WHERE id = ?',
    [residentId]
  );
  if (residentRows.length === 0) return null;

  const baseline = residentRows[0];
  const result = analyzeVitals(reading, baseline);

  await db.query(
    'UPDATE vitals_log SET is_anomaly = ?, anomaly_reason = ? WHERE id = ?',
    [result.isAnomaly, result.reason || null, vitalsLogId]
  );

  if (result.isAnomaly) {
    const [alertResult] = await db.query(
      `INSERT INTO alerts (resident_id, type, message, severity) VALUES (?, 'vitals', ?, ?)`,
      [residentId, result.reason, result.severity]
    );
    if (io) {
      io.emit('new_alert', {
        id: alertResult.insertId, resident_id: residentId, resident_name: baseline.name,
        type: 'vitals', message: result.reason, severity: result.severity, created_at: new Date()
      });
    }
  } else {
    // Only check trend when there's no immediate anomaly already flagged
    const trendMessage = await checkTrend(residentId, baseline);
    if (trendMessage) {
      const [alertResult] = await db.query(
        `INSERT INTO alerts (resident_id, type, message, severity) VALUES (?, 'vitals', ?, 'medium')`,
        [residentId, trendMessage]
      );
      if (io) {
        io.emit('new_alert', {
          id: alertResult.insertId, resident_id: residentId, resident_name: baseline.name,
          type: 'vitals', message: trendMessage, severity: 'medium', created_at: new Date()
        });
      }
      result.trendWarning = trendMessage;
    }
  }

  return result;
}

module.exports = { analyzeVitals, processVitalsReading };