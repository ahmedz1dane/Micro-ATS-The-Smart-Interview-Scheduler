import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../src/app.js';
import Interviewer from '../src/models/Interviewer.js';
import Candidate from '../src/models/Candidate.js';
import InterviewSlot from '../src/models/InterviewSlot.js';

let mongod;
let app;
let interviewer;
let david;
let emma;

// Bookings must be in the future, so build times relative to "now" instead of
// hardcoding a calendar date that would eventually drift into the past.
const HOUR = 60 * 60 * 1000;
const future = (hours) => new Date(Date.now() + hours * HOUR).toISOString();

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  app = createApp();
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await Promise.all([
    Interviewer.deleteMany({}),
    Candidate.deleteMany({}),
    InterviewSlot.deleteMany({}),
  ]);
  interviewer = await Interviewer.create({ name: 'Alice Chen', specialty: 'Backend' });
  david = await Candidate.create({ name: 'David Kim' });
  emma = await Candidate.create({ name: 'Emma Wilson' });
});

const book = (body) => request(app).post('/api/schedule').send(body);

test('books an interview and stores the time in UTC', async () => {
  const startTime = future(24);
  const endTime = future(25);
  const res = await book({
    candidateId: david.id,
    interviewerId: interviewer.id,
    startTime,
    endTime,
  });

  assert.equal(res.status, 201);
  assert.equal(res.body.status, 'Applied');
  assert.equal(res.body.candidateId.name, 'David Kim');

  const stored = await InterviewSlot.findById(res.body._id);
  assert.equal(stored.startTime.toISOString(), startTime);
  assert.equal(stored.endTime.toISOString(), endTime);
});

test('rejects an overlapping booking with 409 and the conflicting candidate name', async () => {
  await book({
    candidateId: david.id,
    interviewerId: interviewer.id,
    startTime: future(24),
    endTime: future(25),
  });

  const res = await book({
    candidateId: emma.id,
    interviewerId: interviewer.id,
    startTime: future(24.5),
    endTime: future(25.5),
  });

  assert.equal(res.status, 409);
  assert.equal(res.body.conflictType, 'interviewer');
  assert.equal(res.body.conflictingCandidate, 'David Kim');
  assert.ok(res.body.conflictingSlot);
});

test('allows back-to-back bookings', async () => {
  await book({
    candidateId: david.id,
    interviewerId: interviewer.id,
    startTime: future(24),
    endTime: future(25),
  });

  const res = await book({
    candidateId: emma.id,
    interviewerId: interviewer.id,
    startTime: future(25),
    endTime: future(26),
  });

  assert.equal(res.status, 201);
});

test('allows the same time for a different interviewer', async () => {
  const bob = await Interviewer.create({ name: 'Bob Martinez' });
  const startTime = future(24);
  const endTime = future(25);

  await book({
    candidateId: david.id,
    interviewerId: interviewer.id,
    startTime,
    endTime,
  });

  const res = await book({
    candidateId: emma.id,
    interviewerId: bob.id,
    startTime,
    endTime,
  });

  assert.equal(res.status, 201);
});

test('concurrent overlapping bookings yield exactly one success', async () => {
  const payload = {
    interviewerId: interviewer.id,
    startTime: future(24),
    endTime: future(25),
  };

  const responses = await Promise.all(
    Array.from({ length: 10 }, () => book({ ...payload, candidateId: david.id }))
  );

  assert.equal(responses.filter((r) => r.status === 201).length, 1);
  assert.equal(responses.filter((r) => r.status === 409).length, 9);
  assert.equal(await InterviewSlot.countDocuments({ interviewerId: interviewer.id }), 1);
});

test('a numeric id is rejected with 400', async () => {
  const res = await book({
    candidateId: 1751619600000,
    interviewerId: interviewer.id,
    startTime: future(24),
    endTime: future(25),
  });
  assert.equal(res.status, 400);
});

test('missing fields are rejected with 400', async () => {
  const res = await book({ candidateId: david.id });
  assert.equal(res.status, 400);
});

test('startTime after endTime is rejected with 400', async () => {
  const res = await book({
    candidateId: david.id,
    interviewerId: interviewer.id,
    startTime: future(25),
    endTime: future(24),
  });
  assert.equal(res.status, 400);
});

test('a start time in the past is rejected with 400', async () => {
  const res = await book({
    candidateId: david.id,
    interviewerId: interviewer.id,
    startTime: future(-2),
    endTime: future(-1),
  });
  assert.equal(res.status, 400);
  assert.match(res.body.error, /past/i);
});

test('an interview longer than 8 hours is rejected with 400', async () => {
  const res = await book({
    candidateId: david.id,
    interviewerId: interviewer.id,
    startTime: future(24),
    endTime: future(33), // 9 hours
  });
  assert.equal(res.status, 400);
  assert.match(res.body.error, /8 hours/i);
});

test('the same candidate cannot be double-booked with a different interviewer', async () => {
  const bob = await Interviewer.create({ name: 'Bob Martinez' });

  await book({
    candidateId: david.id,
    interviewerId: interviewer.id,
    startTime: future(24),
    endTime: future(25),
  });

  const res = await book({
    candidateId: david.id,
    interviewerId: bob.id,
    startTime: future(24.5),
    endTime: future(25.5),
  });

  assert.equal(res.status, 409);
  assert.equal(res.body.conflictType, 'candidate');
  assert.equal(res.body.conflictingInterviewer, 'Alice Chen');
});

test('an unknown candidate is rejected with 404', async () => {
  const res = await book({
    candidateId: new mongoose.Types.ObjectId().toString(),
    interviewerId: interviewer.id,
    startTime: future(24),
    endTime: future(25),
  });
  assert.equal(res.status, 404);
});

test('updates a slot status', async () => {
  const created = await book({
    candidateId: david.id,
    interviewerId: interviewer.id,
    startTime: future(24),
    endTime: future(25),
  });

  const res = await request(app)
    .patch(`/api/slots/${created.body._id}/status`)
    .send({ status: 'Offered' });

  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'Offered');
});

test('returns an interviewer calendar', async () => {
  await book({
    candidateId: david.id,
    interviewerId: interviewer.id,
    startTime: future(24),
    endTime: future(25),
  });

  const res = await request(app).get(`/api/interviewers/${interviewer.id}/slots`);
  assert.equal(res.status, 200);
  assert.equal(res.body.length, 1);
  assert.equal(res.body[0].candidateId.name, 'David Kim');
});
