import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import CalendarGrid from './CalendarGrid.jsx';
import ScheduleForm from './ScheduleForm.jsx';
import { todayLocalKey, formatRange, formatDate } from '../utils/time.js';
import Select from './Select.jsx';
import DatePicker from './DatePicker.jsx';
import { User, Users, Calendar, CalendarCheck, AlertTriangle, CheckCircle, X } from './icons.jsx';

const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || '?';

export default function Dashboard({ interviewers, candidates }) {
  const [interviewerId, setInterviewerId] = useState(interviewers[0]?._id ?? '');
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(todayLocalKey());
  const [conflict, setConflict] = useState(null);
  const [notice, setNotice] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const interviewerRef = useRef(interviewerId);
  useEffect(() => {
    interviewerRef.current = interviewerId;
  }, [interviewerId]);

  const loadSlots = useCallback(async (id) => {
    if (!id) return;
    setLoadingSlots(true);
    try {
      setSlots(await api.getInterviewerSlots(id));
    } catch (e) {
      setNotice({ type: 'error', text: e.message });
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    loadSlots(interviewerId);
    setConflict(null);
    setNotice(null);
  }, [interviewerId, loadSlots]);

  async function handleSchedule(payload) {
    setConflict(null);
    setNotice(null);
    try {
      const slot = await api.schedule(payload);
      setNotice({ type: 'success', text: `Interview booked with ${slot.candidateId?.name ?? 'the candidate'}.` });
      await loadSlots(interviewerId);
    } catch (err) {
      if (err.status === 409) setConflict(err.body);
      else setNotice({ type: 'error', text: err.message });
      throw err;
    }
  }

  async function handleStatusChange(slotId, status) {
    const prevStatus = slots.find((s) => s._id === slotId)?.status;
    const requestInterviewerId = interviewerId;

    setSlots((cur) => cur.map((s) => (s._id === slotId ? { ...s, status } : s)));
    try {
      await api.updateStatus(slotId, status);
    } catch (err) {
      if (interviewerRef.current === requestInterviewerId && prevStatus !== undefined) {
        setSlots((cur) => cur.map((s) => (s._id === slotId ? { ...s, status: prevStatus } : s)));
        setNotice({ type: 'error', text: `Couldn’t update status: ${err.message}` });
      }
    }
  }

  const [clock, setClock] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  const timeStr = clock.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  const selected = interviewers.find((i) => i._id === interviewerId);
  const dayCount = slots.filter(
    (s) => new Date(s.startTime).toDateString() === new Date(`${selectedDate}T12:00`).toDateString()
  ).length;

  return (
    <div className="dashboard">
      <div className="ghost" aria-hidden="true">
        Schedule
      </div>

      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <CalendarCheck size={22} />
          </div>
          <div className="brand-text">
            <div className="brand-name">Micro-ATS</div>
            <div className="brand-role">Interview Scheduler</div>
          </div>
        </div>
        <div className="clock">
          <span className="clock-time">{timeStr}</span>
          <span className="live-dot" />
        </div>
      </header>

      <div className="stats">
        <div className="stat">
          <span className="stat-ico">
            <Users size={18} />
          </span>
          <div>
            <div className="stat-num">{interviewers.length}</div>
            <div className="stat-label">Interviewers</div>
          </div>
        </div>
        <div className="stat">
          <span className="stat-ico">
            <User size={18} />
          </span>
          <div>
            <div className="stat-num">{candidates.length}</div>
            <div className="stat-label">Candidates</div>
          </div>
        </div>
        <div className="stat">
          <span className="stat-ico">
            <CalendarCheck size={18} />
          </span>
          <div>
            <div className="stat-num">{slots.length}</div>
            <div className="stat-label">Booked · {selected?.name?.split(' ')[0] ?? '—'}</div>
          </div>
        </div>
      </div>

      <div className="controls">
        <div className="field">
          <span className="field-label">Interviewer</span>
          <Select
            value={interviewerId}
            onChange={setInterviewerId}
            lead={<User size={16} />}
            options={interviewers.map((iv) => ({ value: iv._id, label: iv.name, hint: iv.specialty }))}
          />
        </div>

        <div className="field">
          <span className="field-label">Day</span>
          <DatePicker
            value={selectedDate}
            onChange={(v) => {
              setSelectedDate(v);
              setConflict(null);
              setNotice(null);
            }}
          />
        </div>
      </div>

      {conflict && (
        <div className="banner conflict" role="alert">
          <span className="banner-icon">
            <AlertTriangle size={18} />
          </span>
          <div className="banner-body">
            <div className="banner-title">Scheduling conflict · 409</div>
            <div className="banner-msg">
              {selected?.name ?? 'This interviewer'} is already booked — this overlaps an interview
              with <strong>{conflict.conflictingCandidate}</strong>
              {conflict.conflictingSlot && (
                <>
                  {' '}on {formatDate(conflict.conflictingSlot.startTime)},{' '}
                  {formatRange(conflict.conflictingSlot.startTime, conflict.conflictingSlot.endTime)}
                </>
              )}
              .
            </div>
          </div>
          <button className="banner-close" onClick={() => setConflict(null)} aria-label="Dismiss">
            <X size={16} />
          </button>
        </div>
      )}

      {notice && (
        <div className={`banner ${notice.type}`} role="status">
          <span className="banner-icon">
            {notice.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          </span>
          <div className="banner-body">
            <div className="banner-title">{notice.type === 'success' ? 'Success' : 'Something went wrong'}</div>
            <div className="banner-msg">{notice.text}</div>
          </div>
          <button className="banner-close" onClick={() => setNotice(null)} aria-label="Dismiss">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="dashboard-body">
        <section className="panel calendar-panel">
          <div className="panel-head">
            <div className="who">
              <div className="avatar">{initials(selected?.name)}</div>
              <div>
                <div className="who-name">{selected?.name ?? 'Interviewer'}</div>
                <div className="who-sub">
                  {selected?.specialty ? `${selected.specialty} · ` : ''}
                  {dayCount} {dayCount === 1 ? 'interview' : 'interviews'} today
                  {loadingSlots && <span className="loading-dot"> · syncing…</span>}
                </div>
              </div>
            </div>
            <div className="day-chip">
              <Calendar size={14} />
              {formatDate(`${selectedDate}T12:00`)}
            </div>
          </div>

          <CalendarGrid slots={slots} selectedDate={selectedDate} onStatusChange={handleStatusChange} />
        </section>

        <aside className="form-panel">
          <div className="panel">
            <div className="panel-head">
              <div className="who">
                <div className="who-name">Book an interview</div>
              </div>
            </div>
            <ScheduleForm
              candidates={candidates}
              interviewerId={interviewerId}
              defaultDate={selectedDate}
              onSchedule={handleSchedule}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
