const BASE = '/api';

async function handle(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

const json = (method, body) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const api = {
  getInterviewers: () => fetch(`${BASE}/interviewers`).then(handle),
  getCandidates: () => fetch(`${BASE}/candidates`).then(handle),
  getInterviewerSlots: (interviewerId) =>
    fetch(`${BASE}/interviewers/${interviewerId}/slots`).then(handle),
  schedule: (payload) => fetch(`${BASE}/schedule`, json('POST', payload)).then(handle),
  updateStatus: (slotId, status) =>
    fetch(`${BASE}/slots/${slotId}/status`, json('PATCH', { status })).then(handle),
};
