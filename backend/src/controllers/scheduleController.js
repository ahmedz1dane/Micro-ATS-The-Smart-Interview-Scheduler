import mongoose from 'mongoose';
import Candidate from '../models/Candidate.js';
import Interviewer from '../models/Interviewer.js';
import InterviewSlot, { INTERVIEW_STATUSES } from '../models/InterviewSlot.js';
import { withLock } from '../utils/lock.js';

const isValidId = (id) => typeof id === 'string' && mongoose.Types.ObjectId.isValid(id);

// Real-world booking rules.
const PAST_GRACE_MS = 60 * 1000; // tolerate "book for now" clicks despite minor clock skew
const MAX_INTERVIEW_MS = 8 * 60 * 60 * 1000; // an interview shouldn't span more than a working day

export async function scheduleInterview(req, res, next) {
  try {
    const { candidateId, interviewerId, startTime, endTime, status } = req.body ?? {};

    if (!candidateId || !interviewerId || !startTime || !endTime) {
      return res.status(400).json({
        error: 'candidateId, interviewerId, startTime and endTime are all required.',
      });
    }
    if (!isValidId(candidateId) || !isValidId(interviewerId)) {
      return res.status(400).json({ error: 'candidateId and interviewerId must be valid ids.' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ error: 'startTime and endTime must be valid ISO-8601 dates.' });
    }
    if (start >= end) {
      return res.status(400).json({ error: 'startTime must be before endTime.' });
    }
    if (start.getTime() < Date.now() - PAST_GRACE_MS) {
      return res.status(400).json({
        error: 'startTime cannot be in the past. Schedule the interview for now or a future time.',
      });
    }
    if (end.getTime() - start.getTime() > MAX_INTERVIEW_MS) {
      return res.status(400).json({ error: 'An interview cannot be longer than 8 hours.' });
    }
    if (status !== undefined && !INTERVIEW_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${INTERVIEW_STATUSES.join(', ')}.` });
    }

    const [candidate, interviewer] = await Promise.all([
      Candidate.findById(candidateId),
      Interviewer.findById(interviewerId),
    ]);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found.' });
    if (!interviewer) return res.status(404).json({ error: 'Interviewer not found.' });

    const outcome = await withLock(String(interviewerId), async () => {
      // An existing slot conflicts if it starts before this one ends and ends after it starts.
      const conflict = await InterviewSlot.findOne({
        interviewerId,
        startTime: { $lt: end },
        endTime: { $gt: start },
      }).populate('candidateId', 'name');

      if (conflict) return { conflict };

      // A candidate also can't be in two overlapping interviews at once — even with a
      // different interviewer.
      const candidateConflict = await InterviewSlot.findOne({
        candidateId,
        startTime: { $lt: end },
        endTime: { $gt: start },
      }).populate('interviewerId', 'name');

      if (candidateConflict) return { candidateConflict };

      const created = await InterviewSlot.create({
        candidateId,
        interviewerId,
        startTime: start,
        endTime: end,
        status: status ?? 'Applied',
      });
      await created.populate([
        { path: 'candidateId', select: 'name email' },
        { path: 'interviewerId', select: 'name specialty' },
      ]);
      return { created };
    });

    if (outcome.conflict) {
      const { conflict } = outcome;
      return res.status(409).json({
        error: 'Interviewer is already booked for an overlapping time slot.',
        conflictType: 'interviewer',
        conflictingCandidate: conflict.candidateId?.name ?? 'Unknown candidate',
        conflictingSlot: {
          id: conflict._id,
          startTime: conflict.startTime,
          endTime: conflict.endTime,
          status: conflict.status,
        },
      });
    }

    if (outcome.candidateConflict) {
      const { candidateConflict } = outcome;
      return res.status(409).json({
        error: 'Candidate is already booked for an overlapping interview.',
        conflictType: 'candidate',
        conflictingInterviewer: candidateConflict.interviewerId?.name ?? 'another interviewer',
        conflictingSlot: {
          id: candidateConflict._id,
          startTime: candidateConflict.startTime,
          endTime: candidateConflict.endTime,
          status: candidateConflict.status,
        },
      });
    }

    return res.status(201).json(outcome.created);
  } catch (err) {
    next(err);
  }
}
