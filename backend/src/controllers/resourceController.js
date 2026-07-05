import mongoose from 'mongoose';
import Candidate from '../models/Candidate.js';
import Interviewer from '../models/Interviewer.js';
import InterviewSlot, { INTERVIEW_STATUSES } from '../models/InterviewSlot.js';

const isValidId = (id) => typeof id === 'string' && mongoose.Types.ObjectId.isValid(id);

export async function listInterviewers(_req, res, next) {
  try {
    res.json(await Interviewer.find().sort({ name: 1 }));
  } catch (err) {
    next(err);
  }
}

export async function listCandidates(_req, res, next) {
  try {
    res.json(await Candidate.find().sort({ name: 1 }));
  } catch (err) {
    next(err);
  }
}

export async function getInterviewerSlots(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ error: 'Invalid interviewer id.' });
    const slots = await InterviewSlot.find({ interviewerId: id })
      .populate('candidateId', 'name email role')
      .sort({ startTime: 1 });
    res.json(slots);
  } catch (err) {
    next(err);
  }
}

export async function updateSlotStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body ?? {};
    if (!isValidId(id)) return res.status(400).json({ error: 'Invalid slot id.' });
    if (!INTERVIEW_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${INTERVIEW_STATUSES.join(', ')}.` });
    }
    const slot = await InterviewSlot.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).populate('candidateId', 'name email role');
    if (!slot) return res.status(404).json({ error: 'Slot not found.' });
    res.json(slot);
  } catch (err) {
    next(err);
  }
}
