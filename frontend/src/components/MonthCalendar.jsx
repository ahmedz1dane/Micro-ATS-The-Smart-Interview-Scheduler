import { useState } from 'react';
import { ChevronLeft, ChevronRight } from './icons.jsx';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const sameDay = (a, b) =>
  a &&
  b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export default function MonthCalendar({ selected, onPick, minDate }) {
  const anchor = selected || new Date();
  const [view, setView] = useState(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
  const min = minDate ? startOfDay(minDate) : null;

  const year = view.getFullYear();
  const month = view.getMonth();
  const startDow = new Date(year, month, 1).getDay();
  const gridStart = new Date(year, month, 1 - startDow);
  const days = Array.from({ length: 42 }, (_, i) =>
    new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i)
  );
  const today = new Date();

  return (
    <div className="cal2">
      <div className="cal2-head">
        <button
          type="button"
          className="cal2-nav"
          onClick={() => setView(new Date(year, month - 1, 1))}
          aria-label="Previous month"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="cal2-title">
          {view.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </div>
        <button
          type="button"
          className="cal2-nav"
          onClick={() => setView(new Date(year, month + 1, 1))}
          aria-label="Next month"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="cal2-wd">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="cal2-grid">
        {days.map((d, i) => {
          const disabled = min && startOfDay(d) < min;
          return (
            <button
              type="button"
              key={i}
              disabled={disabled}
              className={`cal2-day${d.getMonth() !== month ? ' muted' : ''}${
                sameDay(d, selected) ? ' sel' : ''
              }${sameDay(d, today) ? ' today' : ''}`}
              onClick={() => onPick(d)}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
