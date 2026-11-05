import RoomMember from '../models/RoomMember.js';
import Room from '../models/Room.js';
import HistoryLog from '../models/HistoryLog.js';
// Access matrix (paper Table III)
const ALLOW = { view: ['owner', 'editor', 'viewer'], edit: ['owner', 'editor'], invite: ['owner', 'editor'], manage: ['owner'] };
export const can = (action) => async (req, res, next) => {
  const room = await Room.findById(req.params.roomId);
  if (!room || room.isArchived) return res.status(404).json({ message: 'Room not found' });
  const m = await RoomMember.findOne({ roomId: room._id, userId: req.user._id });
  if (!m || !ALLOW[action].includes(m.role)) return res.status(403).json({ message: 'Forbidden' });
  req.room = room; req.member = m; next();
};
export const logEvent = (roomId, userId, actionType, message, entityId) =>
  HistoryLog.create({ roomId, userId, actionType, message, entityId }).catch(() => {});
export const emitRoom = (req, roomId, event, payload) => {
  const io = req.app.get('io'); const sid = req.headers['x-socket-id'];
  let t = io.to(String(roomId)); if (sid) t = t.except(sid); t.emit(event, payload);
};
