import { useState } from 'react';
import api from '../services/api';

export default function CareAssistant({ residentId }) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const ask = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    const currentQuestion = question;
    setMessages((prev) => [...prev, { role: 'user', text: currentQuestion }]);
    setQuestion('');
    setLoading(true);

    try {
      const res = await api.post('/assistant/ask', { resident_id: residentId, question: currentQuestion });
      setMessages((prev) => [...prev, { role: 'assistant', text: res.data.answer }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Could not reach the assistant right now.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="care-assistant">
      <h4>🤖 Ask the Care Assistant</h4>
      <div className="assistant-messages">
        {messages.length === 0 && (
          <p className="empty-state">Ask things like "Why is this resident flagged today?" or "Any medicine concerns?"</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`assistant-msg msg-${m.role}`}>{m.text}</div>
        ))}
        {loading && <div className="assistant-msg msg-assistant">Thinking...</div>}
      </div>
      <form onSubmit={ask} className="assistant-input-row">
        <input
          placeholder="Ask about this resident's condition..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button type="submit" className="btn-secondary btn-sm">Ask</button>
      </form>
    </div>
  );
}