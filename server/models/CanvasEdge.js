import mongoose from 'mongoose';
export default mongoose.model('CanvasEdge', new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
  source: { type: mongoose.Schema.Types.ObjectId, ref: 'CanvasNode', required: true },
  target: { type: mongoose.Schema.Types.ObjectId, ref: 'CanvasNode', required: true },
}, { timestamps: true }));
