import File from '../models/File.js';
import FileVersion from '../models/FileVersion.js';
import FileNodeLink from '../models/FileNodeLink.js';
import { logEvent } from '../utils/permissions.js';
// Same name in room -> new version (previous content archived to FileVersion); otherwise new File.
const save = async (room, user, file, { name, content = '', changeNote = '' }) => {
  if (!file) return File.create({ roomId: room._id, name, content, size: content.length, uploadedBy: user._id });
  await FileVersion.create({ fileId: file._id, versionNumber: file.currentVersion, content: file.content, author: file.uploadedBy, changeNote });
  Object.assign(file, { content, size: content.length, currentVersion: file.currentVersion + 1, uploadedBy: user._id });
  return file.save();
};
const link = (room, fileId, nodeId) => FileNodeLink.updateOne({ fileId, nodeId }, { roomId: room._id }, { upsert: true });
export const listFiles = async (req, res) =>
  res.json(await File.find({ roomId: req.room._id, isDeleted: false }).select('-content').sort({ updatedAt: -1 }));
export const uploadFile = async (req, res) => {
  const { name } = req.body; if (!name) return res.status(400).json({ message: 'name required' });
  const ex = await File.findOne({ roomId: req.room._id, name, isDeleted: false });
  const f = await save(req.room, req.user, ex, req.body);
  await logEvent(req.room._id, req.user._id, ex ? 'file-updated' : 'file-uploaded', `${req.user.name} ${ex ? 'saved a new version of' : 'uploaded'} ${name}`, f._id);
  if (req.body.nodeId) await link(req.room, f._id, req.body.nodeId);
  res.status(ex ? 200 : 201).json(f);
};
export const getFile = async (req, res) => {
  const f = await File.findOne({ _id: req.params.fileId, roomId: req.room._id, isDeleted: false });
  if (!f) return res.status(404).json({ message: 'File not found' });
  res.json({ ...f.toObject(), links: await FileNodeLink.find({ fileId: f._id }) });
};
export const updateFile = async (req, res) => {
  const f = await File.findOne({ _id: req.params.fileId, roomId: req.room._id, isDeleted: false });
  if (!f) return res.status(404).json({ message: 'File not found' });
  const u = await save(req.room, req.user, f, { name: f.name, content: req.body.content, changeNote: req.body.changeNote });
  await logEvent(req.room._id, req.user._id, 'file-updated', `${req.user.name} saved a new version of ${f.name}`, f._id);
  if (req.body.nodeId) await link(req.room, f._id, req.body.nodeId);
  res.json(u);
};
export const listVersions = async (req, res) =>
  res.json(await FileVersion.find({ fileId: req.params.fileId }).sort({ versionNumber: -1 }).populate('author', 'name'));
export const restoreVersion = async (req, res) => {
  const [f, v] = await Promise.all([File.findOne({ _id: req.params.fileId, roomId: req.room._id }),
    FileVersion.findOne({ fileId: req.params.fileId, versionNumber: req.params.version })]);
  if (!f || !v) return res.status(404).json({ message: 'Not found' });
  res.json(await save(req.room, req.user, f, { name: f.name, content: v.content, changeNote: `Restored v${v.versionNumber}` }));
};
export const linkFile = async (req, res) => {
  await link(req.room, req.params.fileId, req.body.nodeId);
  await logEvent(req.room._id, req.user._id, 'file-linked', `${req.user.name} linked a file to a node`, req.params.fileId);
  res.json({ ok: true });
};
export const filesForNode = async (req, res) => {
  const links = await FileNodeLink.find({ nodeId: req.params.nodeId, roomId: req.room._id }).populate('fileId', '-content');
  res.json(links.map((l) => l.fileId).filter(Boolean));
};
export const linksForRoom = async (req, res) => res.json(await FileNodeLink.find({ roomId: req.room._id }));
