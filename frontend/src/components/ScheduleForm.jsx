import { useEffect, useState } from 'react';
import { localInputToUTCISO, LOCAL_TZ } from '../utils/time.js';
import Select from './Select.jsx';
import DateTimePicker from './DateTimePicker.jsx';
import { User, AlertTriangle, Sparkle } from './icons.jsx';

export default function ScheduleForm({ candidates, interviewerId, defaultDate, onSchedule }) {
  const [candidateId, setCandidateId] = useState(candidates[0]?._id ?? '');
  const [start, setStart] = useState(`${defaultDate}T09:00`);
  const [end, setEnd] = useState(`${defaultDate}T10:00`);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setStart(`${defaultDate}T09:00`);
    setEnd(`${defaultDate}T10:00`);
  }, [defaultDate]);

  async function submit(e) {
    e.preventDefault();
    setError(null);

    const startUTC = safeISO(start);
    const endUTC = safeISO(end);
    if (!candidateId) return setError('Please choose a candidate.');
    if (!startUTC || !endUTC) return setError('Please pick a valid start and end time.');
    if (startUTC >= endUTC) return setError('Start time must be before end time.');

    setBusy(true);
    try {
      await onSchedule({ candidateId, interviewerId, startTime: startUTC, endTime: endUTC });
    } catch (err) {
      if (err.status !== 409) setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="schedule-form" onSubmit={submit}>
      <div className="field">
        <span className="field-label">Candidate</span>
        <Select
          value={candidateId}
          onChange={setCandidateId}
          lead={<User size={16} />}
          options={candidates.map((c) => ({ value: c._id, label: c.name, hint: c.role }))}
        />
      </div>

      <div className="field">
        <span className="field-label">Start · {LOCAL_TZ}</span>
        <DateTimePicker value={start} onChange={setStart} />
      </div>

      <div className="field">
        <span className="field-label">End · {LOCAL_TZ}</span>
        <DateTimePicker value={end} onChange={setEnd} />
      </div>

      {error && (
        <p className="form-error">
          <AlertTriangle size={15} />
          {error}
        </p>
      )}

      <button type="submit" className="btn-primary" disabled={busy}>
        {busy ? (
          <>
            <span className="btn-spin" /> Booking…
          </>
        ) : (
          <>
            <Sparkle size={16} /> Schedule interview
          </>
        )}
      </button>
    </form>
  );
}

function safeISO(localValue) {
  const d = new Date(localValue);
  return Number.isNaN(d.getTime()) ? null : localInputToUTCISO(localValue);
}
