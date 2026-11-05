import mongoose from 'mongoose';
export const ACTIONS = ['node-created', 'node-deleted', 'edge-created', 'edge-deleted', 'note-updated', 'file-uploaded',
  'file-updated', 'file-linked', 'canvas-saved', 'member-invited', 'role-changed', 'member-removed', 'room-created'];
export default mongoose.model('HistoryLog', new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actionType: { type: String, enum: ACTIONS, required: true },
  message: String,
  entityId: mongoose.Schema.Types.ObjectId,
}, { timestamps: true }));
