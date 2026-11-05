import mongoose from 'mongoose';
export default mongoose.model('File', new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
  name: { type: String, required: true },
  content: { type: String, default: '' },
  mimeType: { type: String, default: 'text/plain' },
  size: { type: Number, default: 0 },
  currentVersion: { type: Number, default: 1 },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true }));
