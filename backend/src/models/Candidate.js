import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    role: { type: String, trim: true },
  },
  { timestamps: true }
);

candidateSchema.virtual('interviewSlots', {
  ref: 'InterviewSlot',
  localField: '_id',
  foreignField: 'candidateId',
});

candidateSchema.set('toJSON', { virtuals: true });
candidateSchema.set('toObject', { virtuals: true });

export default mongoose.model('Candidate', candidateSchema);
