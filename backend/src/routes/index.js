import { Router } from 'express';
import { scheduleInterview } from '../controllers/scheduleController.js';
import {
  listInterviewers,
  listCandidates,
  getInterviewerSlots,
  updateSlotStatus,
} from '../controllers/resourceController.js';

const router = Router();

router.post('/schedule', scheduleInterview);
router.get('/interviewers', listInterviewers);
router.get('/interviewers/:id/slots', getInterviewerSlots);
router.get('/candidates', listCandidates);
router.patch('/slots/:id/status', updateSlotStatus);

export default router;
