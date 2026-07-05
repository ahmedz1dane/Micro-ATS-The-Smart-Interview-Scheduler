export const STATUSES = ['Applied', 'Technical Round', 'Offered'];

export const statusClass = (status) => status.replace(/\s+/g, '-').toLowerCase();

export default function StatusToggle({ status, onChange }) {
  return (
    <div className="status-toggle" onClick={(e) => e.stopPropagation()}>
      {STATUSES.map((s) => (
        <button
          key={s}
          type="button"
          className={`status-pill pill-${statusClass(s)} ${s === status ? 'active' : ''}`}
          aria-pressed={s === status}
          onClick={() => s !== status && onChange(s)}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
