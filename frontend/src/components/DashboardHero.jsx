import { Sun, Moon, Sunrise } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function DashboardHero({ residents }) {
  const { user } = useAuth();
  const hour = new Date().getHours();

  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const Icon = hour < 12 ? Sunrise : hour < 17 ? Sun : Moon;

  const critical = residents.filter((r) => r.status === 'critical').length;
  const watch = residents.filter((r) => r.status === 'watch').length;

  const summaryLine =
    critical > 0
      ? `${critical} resident${critical > 1 ? 's need' : ' needs'} immediate attention.`
      : watch > 0
      ? `${watch} resident${watch > 1 ? 's are' : ' is'} being watched closely. Everyone else is stable.`
      : `All ${residents.length} residents are stable right now.`;

  return (
    <div className="dashboard-hero">
      <div className="hero-icon"><Icon size={22} /></div>
      <div>
        <h2>{greeting}, {user?.name?.split(' ')[0]}</h2>
        <p>{summaryLine}</p>
      </div>
      <div className="hero-date">
        {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
      </div>
    </div>
  );
}