import mongoose from 'mongoose';
export default mongoose.model('CanvasNote', new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
  text: { type: String, default: '' },
  position: { x: { type: Number, default: 0 }, y: { type: Number, default: 0 } },
}, { timestamps: true }));
