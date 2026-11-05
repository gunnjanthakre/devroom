import mongoose from 'mongoose';
const s = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
  fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File', required: true },
  nodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'CanvasNode', required: true },
}, { timestamps: true });
s.index({ fileId: 1, nodeId: 1 }, { unique: true });
export default mongoose.model('FileNodeLink', s);
