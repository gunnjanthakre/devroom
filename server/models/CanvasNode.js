import mongoose from 'mongoose';
export const NODE_TYPES = ['frontend', 'backend', 'service', 'database', 'cache', 'queue', 'gateway', 'jwt'];
export default mongoose.model('CanvasNode', new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
  type: { type: String, enum: NODE_TYPES, required: true },
  label: { type: String, default: '' },
  position: { x: { type: Number, default: 0 }, y: { type: Number, default: 0 } },
  width: Number, height: Number,
}, { timestamps: true }));
