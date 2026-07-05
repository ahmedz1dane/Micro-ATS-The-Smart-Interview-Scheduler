import { useEffect, useMemo, useRef, useState } from 'react';
import StatusToggle, { statusClass } from './StatusToggle.jsx';
import { formatRange, formatTime, todayLocalKey } from '../utils/time.js';

const HOUR_HEIGHT = 60;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MS_PER_MIN = 60_000;
const DAY_MINUTES = 24 * 60;
const GRID_HEIGHT = (DAY_MINUTES / 60) * HOUR_HEIGHT;

export default function CalendarGrid({ slots, selectedDate, onStatusChange }) {
  const dayStartMs = useMemo(
    () => new Date(`${selectedDate}T00:00:00`).getTime(),
    [selectedDate]
  );
  const dayEndMs = dayStartMs + DAY_MINUTES * MS_PER_MIN;

  // Position each slot by its local time relative to the day's midnight, so a
  // UTC-stored slot lands at the right row in the viewer's timezone.
  const segments = useMemo(() => {
    return slots
      .map((s) => {
        const startMs = new Date(s.startTime).getTime();
        const endMs = new Date(s.endTime).getTime();
        const segStart = Math.max(startMs, dayStartMs);
        const segEnd = Math.min(endMs, dayEndMs);
        if (segEnd <= segStart) return null;

        const topMin = (segStart - dayStartMs) / MS_PER_MIN;
        const durMin = (segEnd - segStart) / MS_PER_MIN;
        const top = (topMin / 60) * HOUR_HEIGHT;
        const height = Math.min(
          Math.max((durMin / 60) * HOUR_HEIGHT, 30),
          GRID_HEIGHT - top
        );
        const continued = startMs < dayStartMs || endMs > dayEndMs;
        return { slot: s, top, height, continued };
      })
      .filter(Boolean);
  }, [slots, dayStartMs, dayEndMs]);

  const scrollRef = useRef(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const firstTop = segments.length ? Math.min(...segments.map((s) => s.top)) : 8 * HOUR_HEIGHT;
    el.scrollTo({ top: Math.max(firstTop - HOUR_HEIGHT, 0), behavior: 'smooth' });
  }, [segments, selectedDate]);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);
  const isToday = selectedDate === todayLocalKey();
  const nowTop = ((now - dayStartMs) / MS_PER_MIN / 60) * HOUR_HEIGHT;

  return (
    <div className="calendar" ref={scrollRef}>
      <div className="calendar-grid" style={{ height: GRID_HEIGHT }}>
        {HOURS.map((h) => (
          <div key={h} className="hour-row" style={{ top: h * HOUR_HEIGHT, height: HOUR_HEIGHT }}>
            <span className="hour-label">{String(h).padStart(2, '0')}:00</span>
          </div>
        ))}

        {isToday && nowTop >= 0 && nowTop <= GRID_HEIGHT && (
          <div className="now-line" style={{ top: nowTop }}>
            <span className="now-dot" />
            <span className="now-label">{formatTime(now)}</span>
          </div>
        )}

        {segments.length === 0 && (
          <div className="calendar-empty">No interviews scheduled on this day.</div>
        )}

        {segments.map(({ slot: s, top, height, continued }) => (
          <div key={s._id} className={`event status-${statusClass(s.status)}`} style={{ top, height }}>
            <div className="event-head">
              <span className="event-candidate">
                <span className="event-dot" />
                {s.candidateId?.name ?? 'Unknown candidate'}
                {continued && <span className="event-cont" title="Runs across midnight"> ↳</span>}
              </span>
              <span className="event-time">{formatRange(s.startTime, s.endTime)}</span>
            </div>
            <StatusToggle status={s.status} onChange={(next) => onStatusChange(s._id, next)} />
          </div>
        ))}
      </div>
    </div>
  );
}
