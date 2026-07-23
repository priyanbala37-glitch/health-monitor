import { useEffect, useState } from 'react';

export default function Intro({ onComplete }) {
  const [stage, setStage] = useState('drawing'); // drawing -> sunrise -> brand -> exit

  useEffect(() => {
    const t1 = setTimeout(() => setStage('sunrise'), 1400);
    const t2 = setTimeout(() => setStage('brand'), 2200);
    const t3 = setTimeout(() => setStage('exit'), 3600);
    const t4 = setTimeout(() => onComplete(), 4200);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [onComplete]);

  const skip = () => onComplete();

  return (
    <div className={`intro-screen stage-${stage}`} onClick={skip}>
      <svg className="pulse-svg" viewBox="0 0 800 300" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E3A857" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#E3A857" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Sunrise arc, revealed after the pulse draws */}
        <circle className="sun-glow" cx="400" cy="230" r="90" fill="url(#sunGlow)" />
        <path
          className="sunrise-arc"
          d="M 250 230 A 150 150 0 0 1 550 230"
          fill="none"
          stroke="#E3A857"
          strokeWidth="3"
        />
        <line className="horizon" x1="150" y1="230" x2="650" y2="230" stroke="#2A3B52" strokeWidth="1.5" />

        {/* Heartbeat / pulse line */}
        <path
          className="pulse-line"
          d="M 40 150 L 220 150 L 260 90 L 300 210 L 340 60 L 380 150 L 420 150 L 460 130 L 500 150 L 760 150"
          fill="none"
          stroke="#F1F4F0"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <div className="intro-brand">
        <h1>Hearth</h1>
        <p>AI-guided care, watching over every golden year</p>
      </div>

      <button className="intro-skip" onClick={skip}>Skip →</button>
    </div>
  );
}