import { useEffect, useState } from 'react';
import { api } from './api.js';
import Dashboard from './components/Dashboard.jsx';
import { AlertTriangle, CalendarCheck } from './components/icons.jsx';

export default function App() {
  const [interviewers, setInterviewers] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getInterviewers(), api.getCandidates()])
      .then(([iv, cd]) => {
        setInterviewers(iv);
        setCandidates(cd);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="screen-msg">
        <div className="spinner" />
        <p className="screen-title">Loading Micro-ATS…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="screen-msg error">
        <AlertTriangle size={30} />
        <p className="screen-title">Couldn’t reach the API</p>
        <p>{error}</p>
        <p className="hint">Is the backend running on http://localhost:4000?</p>
      </div>
    );
  }

  if (interviewers.length === 0) {
    return (
      <div className="screen-msg">
        <CalendarCheck size={30} />
        <p className="screen-title">No interviewers yet</p>
        <p className="hint">
          Run <code>npm run seed</code> in the backend to add demo data.
        </p>
      </div>
    );
  }

  return <Dashboard interviewers={interviewers} candidates={candidates} />;
}
