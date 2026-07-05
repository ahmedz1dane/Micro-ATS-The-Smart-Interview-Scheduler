import mongoose from 'mongoose';

export const INTERVIEW_STATUSES = ['Applied', 'Technical Round', 'Offered'];

const interviewSlotSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
      index: true,
    },
    interviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interviewer',
      required: true,
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: INTERVIEW_STATUSES,
      default: 'Applied',
    },
  },
  { timestamps: true }
);

interviewSlotSchema.index({ interviewerId: 1, startTime: 1, endTime: 1 });

interviewSlotSchema.pre('validate', function (next) {
  if (this.startTime && this.endTime && this.startTime >= this.endTime) {
    return next(new Error('startTime must be before endTime.'));
  }
  next();
});

export default mongoose.model('InterviewSlot', interviewSlotSchema);
