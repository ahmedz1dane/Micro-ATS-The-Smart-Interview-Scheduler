import Popover from './Popover.jsx';
import MonthCalendar from './MonthCalendar.jsx';
import Select from './Select.jsx';
import { Clock } from './icons.jsx';

const pad = (n) => String(n).padStart(2, '0');
const toYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromYMD = (s) => {
  const [y, m, d] = (s || '').split('-').map(Number);
  return y ? new Date(y, m - 1, d) : null;
};

const HOURS = Array.from({ length: 24 }, (_, i) => ({ value: pad(i), label: pad(i) }));
const MIN_BASE = Array.from({ length: 12 }, (_, i) => pad(i * 5));

export default function DateTimePicker({ value, onChange }) {
  const [datePart = '', timePart = '00:00'] = (value || '').split('T');
  const [hh = '00', mm = '00'] = timePart.split(':');
  const selectedDate = fromYMD(datePart);

  const minutes = MIN_BASE.includes(mm) ? MIN_BASE : [...MIN_BASE, mm].sort();
  const minuteOpts = minutes.map((m) => ({ value: m, label: m }));

  const compose = (dStr, h, m) => `${dStr}T${h}:${m}`;

  const label = value
    ? new Date(value).toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Pick date & time';

  return (
    <Popover
      panelHeight={420}
      panelClassName="cal-panel"
      trigger={({ open, toggle }) => (
        <button type="button" className={`field-trigger ${open ? 'open' : ''}`} onClick={toggle}>
          <span className="ft-lead">
            <Clock size={16} />
          </span>
          <span className="ft-value">{label}</span>
        </button>
      )}
    >
      {({ close }) => (
        <>
          <MonthCalendar
            selected={selectedDate}
            onPick={(d) => onChange(compose(toYMD(d), hh, mm))}
          />
          <div className="dtp-time">
            <span className="dtp-time-label">Time</span>
            <div className="time-field">
              <Select value={hh} onChange={(h) => onChange(compose(datePart, h, mm))} options={HOURS} />
            </div>
            <span className="dtp-colon">:</span>
            <div className="time-field">
              <Select value={mm} onChange={(m) => onChange(compose(datePart, hh, m))} options={minuteOpts} />
            </div>
            <button type="button" className="cal2-today-btn dtp-done" onClick={close}>
              Done
            </button>
          </div>
        </>
      )}
    </Popover>
  );
}
