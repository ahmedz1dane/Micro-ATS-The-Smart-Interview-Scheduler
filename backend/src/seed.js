import 'dotenv/config';
import { connectDB, disconnectDB } from './config/db.js';
import Interviewer from './models/Interviewer.js';
import Candidate from './models/Candidate.js';
import InterviewSlot from './models/InterviewSlot.js';

const INTERVIEWERS = [
  { name: 'Alice Chen', email: 'alice@corp.com', specialty: 'Backend' },
  { name: 'Bob Martinez', email: 'bob@corp.com', specialty: 'Frontend' },
  { name: 'Priya Nair', email: 'priya@corp.com', specialty: 'System Design' },
];

const CANDIDATES = [
  { name: 'David Kim', email: 'david@example.com', role: 'Senior Backend Engineer' },
  { name: 'Emma Wilson', email: 'emma@example.com', role: 'Frontend Engineer' },
  { name: 'Frank Zhou', email: 'frank@example.com', role: 'Full Stack Engineer' },
  { name: 'Grace Lee', email: 'grace@example.com', role: 'Platform Engineer' },
];

function todaysSlots(interviewers, candidates) {
  const midnight = new Date();
  midnight.setUTCHours(0, 0, 0, 0);
  const at = (h, m = 0) => {
    const d = new Date(midnight);
    d.setUTCHours(h, m, 0, 0);
    return d;
  };
  const [alice, bob] = interviewers;
  const [david, emma, frank] = candidates;
  return [
    { interviewerId: alice._id, candidateId: david._id, startTime: at(9), endTime: at(10), status: 'Technical Round' },
    { interviewerId: alice._id, candidateId: emma._id, startTime: at(11), endTime: at(12), status: 'Applied' },
    { interviewerId: bob._id, candidateId: frank._id, startTime: at(9), endTime: at(10, 30), status: 'Offered' },
  ];
}

export async function seedDatabase() {
  await Promise.all([
    Interviewer.deleteMany({}),
    Candidate.deleteMany({}),
    InterviewSlot.deleteMany({}),
  ]);
  const interviewers = await Interviewer.insertMany(INTERVIEWERS);
  const candidates = await Candidate.insertMany(CANDIDATES);
  await InterviewSlot.insertMany(todaysSlots(interviewers, candidates));
  return { interviewers: interviewers.length, candidates: candidates.length };
}

export async function seedIfEmpty() {
  if ((await Interviewer.countDocuments()) === 0) {
    await seedDatabase();
  }
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  connectDB()
    .then(seedDatabase)
    .then((r) => console.log(`Seeded ${r.interviewers} interviewers and ${r.candidates} candidates.`))
    .then(disconnectDB)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}
