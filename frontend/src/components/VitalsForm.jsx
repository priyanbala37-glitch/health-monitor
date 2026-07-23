import { useState } from 'react';
import api from '../services/api';

export default function VitalsForm({ residentId, onLogged }) {
  const [form, setForm] = useState({
    heart_rate: '', spo2: '', temperature: '', bp_systolic: '', bp_diastolic: ''
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Quick demo helper: fill in randomized "sensor-like" readings
  const simulateReading = (abnormal = false) => {
    if (abnormal) {
      setForm({
        heart_rate: 125 + Math.floor(Math.random() * 15),
        spo2: 85 + Math.floor(Math.random() * 5),
        temperature: (100.5 + Math.random()).toFixed(1),
        bp_systolic: 145 + Math.floor(Math.random() * 10),
        bp_diastolic: 92 + Math.floor(Math.random() * 6),
      });
    } else {
      setForm({
        heart_rate: 70 + Math.floor(Math.random() * 10),
        spo2: 96 + Math.floor(Math.random() * 3),
        temperature: (98 + Math.random()).toFixed(1),
        bp_systolic: 115 + Math.floor(Math.random() * 10),
        bp_diastolic: 75 + Math.floor(Math.random() * 8),
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post('/vitals', { resident_id: residentId, ...form });
      setResult(res.data.aiAnalysis);
      onLogged?.();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vitals-form-card">
      <h4>📟 Log Vitals</h4>
      <div className="simulate-buttons">
        <button type="button" onClick={() => simulateReading(false)} className="btn-secondary">
          Simulate Normal Reading
        </button>
        <button type="button" onClick={() => simulateReading(true)} className="btn-warning">
          Simulate Abnormal Reading
        </button>
      </div>

      <form onSubmit={handleSubmit} className="vitals-grid">
        <label>Heart Rate (bpm)
          <input name="heart_rate" type="number" value={form.heart_rate} onChange={handleChange} required />
        </label>
        <label>SpO2 (%)
          <input name="spo2" type="number" value={form.spo2} onChange={handleChange} required />
        </label>
        <label>Temperature (°F)
          <input name="temperature" type="number" step="0.1" value={form.temperature} onChange={handleChange} required />
        </label>
        <label>BP Systolic
          <input name="bp_systolic" type="number" value={form.bp_systolic} onChange={handleChange} required />
        </label>
        <label>BP Diastolic
          <input name="bp_diastolic" type="number" value={form.bp_diastolic} onChange={handleChange} required />
        </label>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Analyzing...' : 'Log & Analyze'}
        </button>
      </form>

      {result && (
        <div className={`ai-result ${result.isAnomaly ? 'ai-anomaly' : 'ai-normal'}`}>
          <strong>{result.isAnomaly ? '⚠️ AI detected an anomaly' : '✅ AI: All readings normal'}</strong>
          {result.reason && <p>{result.reason}</p>}
        </div>
      )}
    </div>
  );
}