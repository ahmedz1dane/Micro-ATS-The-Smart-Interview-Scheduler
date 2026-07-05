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
  const res = await book({
    candidateId: david.id,
    interviewerId: interviewer.id,
    startTime: '2026-07-04T09:00:00.000Z',
    endTime: '2026-07-04T10:00:00.000Z',
  });

  assert.equal(res.status, 201);
  assert.equal(res.body.status, 'Applied');
  assert.equal(res.body.candidateId.name, 'David Kim');

  const stored = await InterviewSlot.findById(res.body._id);
  assert.equal(stored.startTime.toISOString(), '2026-07-04T09:00:00.000Z');
  assert.equal(stored.endTime.toISOString(), '2026-07-04T10:00:00.000Z');
});

test('rejects an overlapping booking with 409 and the conflicting candidate name', async () => {
  await book({
    candidateId: david.id,
    interviewerId: interviewer.id,
    startTime: '2026-07-04T09:00:00.000Z',
    endTime: '2026-07-04T10:00:00.000Z',
  });

  const res = await book({
    candidateId: emma.id,
    interviewerId: interviewer.id,
    startTime: '2026-07-04T09:30:00.000Z',
    endTime: '2026-07-04T10:30:00.000Z',
  });

  assert.equal(res.status, 409);
  assert.equal(res.body.conflictingCandidate, 'David Kim');
  assert.ok(res.body.conflictingSlot);
});

test('allows back-to-back bookings', async () => {
  await book({
    candidateId: david.id,
    interviewerId: interviewer.id,
    startTime: '2026-07-04T09:00:00.000Z',
    endTime: '2026-07-04T10:00:00.000Z',
  });

  const res = await book({
    candidateId: emma.id,
    interviewerId: interviewer.id,
    startTime: '2026-07-04T10:00:00.000Z',
    endTime: '2026-07-04T11:00:00.000Z',
  });

  assert.equal(res.status, 201);
});

test('allows the same time for a different interviewer', async () => {
  const bob = await Interviewer.create({ name: 'Bob Martinez' });

  await book({
    candidateId: david.id,
    interviewerId: interviewer.id,
    startTime: '2026-07-04T09:00:00.000Z',
    endTime: '2026-07-04T10:00:00.000Z',
  });

  const res = await book({
    candidateId: emma.id,
    interviewerId: bob.id,
    startTime: '2026-07-04T09:00:00.000Z',
    endTime: '2026-07-04T10:00:00.000Z',
  });

  assert.equal(res.status, 201);
});

test('concurrent overlapping bookings yield exactly one success', async () => {
  const payload = {
    interviewerId: interviewer.id,
    startTime: '2026-07-04T09:00:00.000Z',
    endTime: '2026-07-04T10:00:00.000Z',
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
    startTime: '2026-07-04T09:00:00.000Z',
    endTime: '2026-07-04T10:00:00.000Z',
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
    startTime: '2026-07-04T10:00:00.000Z',
    endTime: '2026-07-04T09:00:00.000Z',
  });
  assert.equal(res.status, 400);
});

test('an unknown candidate is rejected with 404', async () => {
  const res = await book({
    candidateId: new mongoose.Types.ObjectId().toString(),
    interviewerId: interviewer.id,
    startTime: '2026-07-04T09:00:00.000Z',
    endTime: '2026-07-04T10:00:00.000Z',
  });
  assert.equal(res.status, 404);
});

test('updates a slot status', async () => {
  const created = await book({
    candidateId: david.id,
    interviewerId: interviewer.id,
    startTime: '2026-07-04T09:00:00.000Z',
    endTime: '2026-07-04T10:00:00.000Z',
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
    startTime: '2026-07-04T09:00:00.000Z',
    endTime: '2026-07-04T10:00:00.000Z',
  });

  const res = await request(app).get(`/api/interviewers/${interviewer.id}/slots`);
  assert.equal(res.status, 200);
  assert.equal(res.body.length, 1);
  assert.equal(res.body[0].candidateId.name, 'David Kim');
});
