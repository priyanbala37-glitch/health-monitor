import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function VitalsChart({ vitals }) {
  const chartData = [...vitals].reverse().map((v) => ({
    time: new Date(v.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    'Heart Rate': v.heart_rate,
    'SpO2': v.spo2,
  }));

  if (chartData.length === 0) return <p className="empty-state">No vitals recorded yet.</p>;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="Heart Rate" stroke="#e74c3c" strokeWidth={2} />
        <Line type="monotone" dataKey="SpO2" stroke="#3498db" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}