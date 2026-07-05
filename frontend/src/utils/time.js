export const LOCAL_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'your local time';

export function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatRange(startIso, endIso) {
  return `${formatTime(startIso)} – ${formatTime(endIso)}`;
}

export function localDateKey(iso) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayLocalKey() {
  return localDateKey(new Date());
}

// A datetime-local value is local wall-clock; toISOString gives the UTC instant.
export function localInputToUTCISO(localValue) {
  return new Date(localValue).toISOString();
}
