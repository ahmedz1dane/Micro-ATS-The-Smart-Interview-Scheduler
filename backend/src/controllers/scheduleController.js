import mongoose from 'mongoose';
import Candidate from '../models/Candidate.js';
import Interviewer from '../models/Interviewer.js';
import InterviewSlot, { INTERVIEW_STATUSES } from '../models/InterviewSlot.js';
import { withLock } from '../utils/lock.js';

const isValidId = (id) => typeof id === 'string' && mongoose.Types.ObjectId.isValid(id);

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
        conflictingCandidate: conflict.candidateId?.name ?? 'Unknown candidate',
        conflictingSlot: {
          id: conflict._id,
          startTime: conflict.startTime,
          endTime: conflict.endTime,
          status: conflict.status,
        },
      });
    }

    return res.status(201).json(outcome.created);
  } catch (err) {
    next(err);
  }
}
