import mongoose from 'mongoose';
const s = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['owner', 'editor', 'viewer'], default: 'viewer' },
  joinedAt: { type: Date, default: Date.now },
});
s.index({ roomId: 1, userId: 1 }, { unique: true });
export default mongoose.model('RoomMember', s);
