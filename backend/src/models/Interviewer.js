import mongoose from 'mongoose';

const interviewerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    specialty: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model('Interviewer', interviewerSchema);
