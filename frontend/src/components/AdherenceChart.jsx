import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

export default function AdherenceChart({ residentId }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    api.get(`/medicines/${residentId}/adherence`).then((res) => {
      setData(res.data.map((d) => ({
        day: new Date(d.date).toLocaleDateString([], { weekday: 'short' }),
        Adherence: d.adherence
      })));
    });
  }, [residentId]);

  if (data.length === 0) return <p className="empty-state">No adherence data yet — starts appearing after the first logged day.</p>;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" />
        <YAxis domain={[0, 100]} unit="%" />
        <Tooltip />
        <Bar dataKey="Adherence" fill="#2F6F5E" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}