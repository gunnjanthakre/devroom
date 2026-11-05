import mongoose from 'mongoose';
export default mongoose.model('Room', new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isArchived: { type: Boolean, default: false },
}, { timestamps: true }));
