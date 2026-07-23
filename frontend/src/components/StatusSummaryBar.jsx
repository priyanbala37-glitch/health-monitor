export default function StatusSummaryBar({ residents, activeAlertCount }) {
  const total = residents.length;
  const critical = residents.filter((r) => r.status === 'critical').length;
  const watch = residents.filter((r) => r.status === 'watch').length;
  const normal = total - critical - watch;

  return (
    <div className="summary-bar">
      <div className="summary-stat">
        <span className="summary-number">{total}</span>
        <span className="summary-label">Residents</span>
      </div>
      <div className="summary-stat stat-normal">
        <span className="summary-number">{normal}</span>
        <span className="summary-label">Normal</span>
      </div>
      <div className="summary-stat stat-watch">
        <span className="summary-number">{watch}</span>
        <span className="summary-label">Watch</span>
      </div>
      <div className="summary-stat stat-critical">
        <span className="summary-number">{critical}</span>
        <span className="summary-label">Critical</span>
      </div>
      <div className="summary-stat stat-alerts">
        <span className="summary-number">{activeAlertCount}</span>
        <span className="summary-label">Active Alerts</span>
      </div>
    </div>
  );
}