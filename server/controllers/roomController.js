import Room from '../models/Room.js';
import RoomMember from '../models/RoomMember.js';
import User from '../models/User.js';
import HistoryLog from '../models/HistoryLog.js';
import { logEvent } from '../utils/permissions.js';
export const listRooms = async (req, res) => {
  const ms = await RoomMember.find({ userId: req.user._id }).populate('roomId');
  res.json(ms.filter((m) => m.roomId && !m.roomId.isArchived).map((m) => ({ ...m.roomId.toObject(), role: m.role })));
};
export const createRoom = async (req, res) => {
  if (!req.body.name) return res.status(400).json({ message: 'name required' });
  const room = await Room.create({ name: req.body.name, description: req.body.description, createdBy: req.user._id });
  await RoomMember.create({ roomId: room._id, userId: req.user._id, role: 'owner' });
  await logEvent(room._id, req.user._id, 'room-created', `Room "${room.name}" created`, room._id);
  res.status(201).json({ ...room.toObject(), role: 'owner' });
};
export const getRoom = async (req, res) => res.json({ ...req.room.toObject(), role: req.member.role });
export const archiveRoom = async (req, res) => { req.room.isArchived = true; await req.room.save(); res.json({ ok: true }); };  // soft delete
export const listMembers = async (req, res) =>
  res.json(await RoomMember.find({ roomId: req.room._id }).populate('userId', 'name email profileImage'));
export const inviteMember = async (req, res) => {
  const { email, role = 'viewer' } = req.body;
  if (!['editor', 'viewer'].includes(role)) return res.status(400).json({ message: 'role must be editor or viewer' });
  const u = await User.findOne({ email: (email || '').toLowerCase() });
  if (!u) return res.status(404).json({ message: 'No user with that email' });
  if (await RoomMember.findOne({ roomId: req.room._id, userId: u._id })) return res.status(409).json({ message: 'Already a member' });
  const m = await RoomMember.create({ roomId: req.room._id, userId: u._id, role });
  await logEvent(req.room._id, req.user._id, 'member-invited', `${req.user.name} invited ${u.name} as ${role}`, u._id);
  res.status(201).json(m);
};
export const changeRole = async (req, res) => {
  const { role } = req.body;
  if (!['owner', 'editor', 'viewer'].includes(role)) return res.status(400).json({ message: 'bad role' });
  const m = await RoomMember.findOneAndUpdate({ roomId: req.room._id, userId: req.params.userId }, { role }, { new: true });
  if (!m) return res.status(404).json({ message: 'Member not found' });
  await logEvent(req.room._id, req.user._id, 'role-changed', `${req.user.name} changed a member's role to ${role}`, m.userId);
  res.json(m);
};
export const removeMember = async (req, res) => {
  if (String(req.params.userId) === String(req.user._id)) return res.status(400).json({ message: 'Owner cannot remove self' });
  await RoomMember.deleteOne({ roomId: req.room._id, userId: req.params.userId });
  await logEvent(req.room._id, req.user._id, 'member-removed', `${req.user.name} removed a member`, req.params.userId);
  res.json({ ok: true });
};
export const listHistory = async (req, res) =>
  res.json(await HistoryLog.find({ roomId: req.room._id }).sort({ createdAt: -1 }).limit(200).populate('userId', 'name'));
