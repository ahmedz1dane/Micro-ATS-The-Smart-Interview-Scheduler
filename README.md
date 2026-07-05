# Micro-ATS — Interview Scheduler

A dashboard to assign candidates to interviewers for a time slot. Each interviewer
has a calendar view, and the backend rejects any booking that overlaps one of the
interviewer's existing interviews.

- **backend/** — Node, Express, MongoDB (Mongoose)
- **frontend/** — React (Vite)

## Requirements

- Node.js 18 or newer (`node --version`)
- MongoDB is **optional** — if no connection string is set, the backend starts an
  in-memory database and loads demo data automatically, so there's nothing else
  to install.

## Run it

From the project root:

```bash
bash run.sh
```

(or `./run.sh` — if you get "Permission denied", run `chmod +x run.sh` first.)

This installs dependencies on the first run and starts both servers. Then open
**http://localhost:5173**.

### Or run the two apps manually

Backend (first terminal):

```bash
cd backend
npm install
npm start          # http://localhost:4000
```

Frontend (second terminal):

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

### Use your own MongoDB (optional)

Create `backend/.env`:

```
MONGODB_URI=mongodb://localhost:27017/micro_ats
```

Then load the demo data once with `npm run seed`.

## Tests

```bash
cd backend
npm test
```

## API

| Method | Route | Description |
| ------ | ----- | ----------- |
| GET | `/api/interviewers` | List interviewers |
| GET | `/api/candidates` | List candidates |
| GET | `/api/interviewers/:id/slots` | An interviewer's booked slots |
| POST | `/api/schedule` | Book a slot |
| PATCH | `/api/slots/:id/status` | Update a slot's status |

`POST /api/schedule` takes `{ candidateId, interviewerId, startTime, endTime }`
with times as UTC ISO-8601. If the interviewer is already booked in that window
it responds with `409` and the conflicting candidate's name.

## Notes

- Interview times are stored in UTC and rendered in the viewer's local timezone.
- An interviewer can't be booked for two overlapping interviews; a clash returns
  `409` with the name of the candidate already in that slot.
- Statuses: `Applied`, `Technical Round`, `Offered`.
