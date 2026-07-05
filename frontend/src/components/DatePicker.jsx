import Popover from './Popover.jsx';
import MonthCalendar from './MonthCalendar.jsx';
import { Calendar } from './icons.jsx';

const pad = (n) => String(n).padStart(2, '0');
const toYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromYMD = (s) => {
  const [y, m, d] = (s || '').split('-').map(Number);
  return y ? new Date(y, m - 1, d) : null;
};

export default function DatePicker({ value, onChange }) {
  const selected = fromYMD(value);
  const label = selected
    ? selected.toLocaleDateString(undefined, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Pick a date';

  return (
    <Popover
      panelHeight={360}
      panelClassName="cal-panel"
      trigger={({ open, toggle }) => (
        <button type="button" className={`field-trigger ${open ? 'open' : ''}`} onClick={toggle}>
          <span className="ft-lead">
            <Calendar size={16} />
          </span>
          <span className="ft-value">{label}</span>
        </button>
      )}
    >
      {({ close }) => (
        <>
          <MonthCalendar
            selected={selected}
            onPick={(d) => {
              onChange(toYMD(d));
              close();
            }}
          />
          <div className="cal2-foot">
            <button
              type="button"
              className="cal2-today-btn"
              onClick={() => {
                onChange(toYMD(new Date()));
                close();
              }}
            >
              Today
            </button>
          </div>
        </>
      )}
    </Popover>
  );
}
