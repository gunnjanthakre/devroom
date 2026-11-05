import mongoose from 'mongoose';
export default mongoose.model('FileVersion', new mongoose.Schema({
  fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File', required: true, index: true },
  versionNumber: { type: Number, required: true },
  content: { type: String, default: '' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  changeNote: { type: String, default: '' },
}, { timestamps: true }));
