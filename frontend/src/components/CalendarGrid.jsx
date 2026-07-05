import { useEffect, useMemo, useRef, useState } from 'react';
import StatusToggle, { statusClass } from './StatusToggle.jsx';
import { formatRange, formatTime, todayLocalKey } from '../utils/time.js';

const HOUR_HEIGHT = 60;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MS_PER_MIN = 60_000;
const DAY_MINUTES = 24 * 60;
const GRID_HEIGHT = (DAY_MINUTES / 60) * HOUR_HEIGHT;

// A short slot still needs room for the name, time and status toggle, so every
// event renders at least this tall regardless of its duration.
const MIN_EVENT_HEIGHT = 78;
const INSET_L = 8; // matches .event left inset in the stylesheet
const INSET_R = 12;
const COL_GAP = 6;

// Split events whose rendered boxes overlap into side-by-side columns so they
// never stack on top of each other. Back-to-back slots (e.g. 9–10 and 10–10:30)
// collide once each box is given its minimum height, so they get columns too.
function packColumns(items) {
  const boxes = items
    .map((it) => {
      const renderHeight = Math.max(it.height, MIN_EVENT_HEIGHT);
      return { ...it, renderHeight, bottom: it.top + renderHeight };
    })
    .sort((a, b) => a.top - b.top || b.bottom - a.bottom);

  const out = [];
  let cluster = [];
  let clusterBottom = -Infinity;

  const flush = () => {
    if (!cluster.length) return;
    const colEnds = []; // bottom edge of the last event placed in each column
    for (const it of cluster) {
      let col = colEnds.findIndex((end) => it.top >= end);
      if (col === -1) {
        col = colEnds.length;
        colEnds.push(it.bottom);
      } else {
        colEnds[col] = it.bottom;
      }
      it.col = col;
    }
    const cols = colEnds.length;
    cluster.forEach((it) => {
      it.cols = cols;
    });
    out.push(...cluster);
    cluster = [];
    clusterBottom = -Infinity;
  };

  for (const it of boxes) {
    if (cluster.length && it.top >= clusterBottom) flush();
    cluster.push(it);
    clusterBottom = Math.max(clusterBottom, it.bottom);
  }
  flush();
  return out;
}

// Left offset and width for an event sitting in column `col` of `cols` columns.
function columnStyle(col, cols) {
  const width = `(100% - ${INSET_L + INSET_R}px - ${(cols - 1) * COL_GAP}px) / ${cols}`;
  return {
    left: `calc(${INSET_L}px + ${col} * ((${width}) + ${COL_GAP}px))`,
    width: `calc(${width})`,
    right: 'auto',
  };
}

export default function CalendarGrid({ slots, selectedDate, onStatusChange }) {
  const dayStartMs = useMemo(
    () => new Date(`${selectedDate}T00:00:00`).getTime(),
    [selectedDate]
  );
  const dayEndMs = dayStartMs + DAY_MINUTES * MS_PER_MIN;

  // Position each slot by its local time relative to the day's midnight, so a
  // UTC-stored slot lands at the right row in the viewer's timezone.
  const segments = useMemo(() => {
    const raw = slots
      .map((s) => {
        const startMs = new Date(s.startTime).getTime();
        const endMs = new Date(s.endTime).getTime();
        const segStart = Math.max(startMs, dayStartMs);
        const segEnd = Math.min(endMs, dayEndMs);
        if (segEnd <= segStart) return null;

        const topMin = (segStart - dayStartMs) / MS_PER_MIN;
        const durMin = (segEnd - segStart) / MS_PER_MIN;
        const top = (topMin / 60) * HOUR_HEIGHT;
        const height = Math.max((durMin / 60) * HOUR_HEIGHT, 30);
        const continued = startMs < dayStartMs || endMs > dayEndMs;
        return { slot: s, top, height, continued };
      })
      .filter(Boolean);
    return packColumns(raw);
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

        {segments.map(({ slot: s, top, renderHeight, continued, col, cols }) => (
          <div
            key={s._id}
            className={`event status-${statusClass(s.status)}`}
            style={{ top, height: renderHeight, ...columnStyle(col, cols) }}
          >
            <div className="event-head">
              <span className="event-candidate">
                <span className="event-dot" />
                <span className="event-name">{s.candidateId?.name ?? 'Unknown candidate'}</span>
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
