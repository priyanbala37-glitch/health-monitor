export default function StatusBadge({ status, size = 'md' }) {
  const config = {
    normal: { label: 'Normal', className: 'status-normal' },
    watch: { label: 'Watch', className: 'status-watch' },
    critical: { label: 'Critical', className: 'status-critical' },
  };
  const c = config[status] || config.normal;

  return <span className={`status-badge ${c.className} size-${size}`}>{c.label}</span>;
}