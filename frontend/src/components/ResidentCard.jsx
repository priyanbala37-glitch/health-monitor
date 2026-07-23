import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';

export default function ResidentCard({ resident }) {
  const navigate = useNavigate();

  return (
    <div className={`resident-card card-status-${resident.status || 'normal'}`} onClick={() => navigate(`/resident/${resident.id}`)}>
      <div className="resident-avatar">{resident.name.charAt(0)}</div>
      <div className="resident-card-body">
        <div className="resident-card-top">
          <h4>{resident.name}</h4>
          <StatusBadge status={resident.status || 'normal'} size="sm" />
        </div>
        <p>Age {resident.age} · Room {resident.room_no || 'N/A'}</p>
        <p className="conditions">{resident.conditions || 'No known conditions'}</p>
      </div>
    </div>
  );
}