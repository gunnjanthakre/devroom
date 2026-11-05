import CanvasNode from '../models/CanvasNode.js';
import CanvasEdge from '../models/CanvasEdge.js';
import CanvasNote from '../models/CanvasNote.js';
import FileNodeLink from '../models/FileNodeLink.js';
import { logEvent, emitRoom } from '../utils/permissions.js';
const load = async (roomId) => {
  const [nodes, edges, notes] = await Promise.all([CanvasNode.find({ roomId }), CanvasEdge.find({ roomId }), CanvasNote.find({ roomId })]);
  return { nodes, edges, notes };
};
export const getCanvas = async (req, res) => res.json(await load(req.room._id));
// Snapshot replacement: delete everything then insert payload; temp client ids are mapped to ObjectIds for edges.
export const saveCanvas = async (req, res) => {
  const roomId = req.room._id; const { nodes = [], edges = [], notes = [] } = req.body;
  await Promise.all([CanvasNode.deleteMany({ roomId }), CanvasEdge.deleteMany({ roomId }), CanvasNote.deleteMany({ roomId })]);
  const docs = await CanvasNode.insertMany(nodes.map((n) => ({ roomId, type: n.type, label: n.label, position: n.position, width: n.width, height: n.height })));
  const map = {}; nodes.forEach((n, i) => (map[n.id] = docs[i]._id));
  await CanvasEdge.insertMany(edges.filter((e) => map[e.source] && map[e.target]).map((e) => ({ roomId, source: map[e.source], target: map[e.target] })));
  await CanvasNote.insertMany(notes.map((n) => ({ roomId, text: n.text, position: n.position })));
  await logEvent(roomId, req.user._id, 'canvas-saved', `${req.user.name} saved the canvas (${nodes.length} nodes, ${edges.length} edges, ${notes.length} notes)`);
  emitRoom(req, roomId, 'canvas-updated', { by: req.user.name });
  res.json(await load(roomId));
};
export const createNode = async (req, res) => {
  const n = await CanvasNode.create({ roomId: req.room._id, ...req.body });
  await logEvent(req.room._id, req.user._id, 'node-created', `${req.user.name} added ${n.type} node "${n.label}"`, n._id);
  emitRoom(req, req.room._id, 'node-created', n); res.status(201).json(n);
};
export const deleteNode = async (req, res) => {
  const { nodeId } = req.params;
  await Promise.all([CanvasNode.deleteOne({ _id: nodeId, roomId: req.room._id }),
    CanvasEdge.deleteMany({ roomId: req.room._id, $or: [{ source: nodeId }, { target: nodeId }] }),
    FileNodeLink.deleteMany({ nodeId })]);
  await logEvent(req.room._id, req.user._id, 'node-deleted', `${req.user.name} deleted a node`, nodeId);
  emitRoom(req, req.room._id, 'node-deleted', { id: nodeId }); res.json({ ok: true });
};
export const createEdge = async (req, res) => {
  const e = await CanvasEdge.create({ roomId: req.room._id, source: req.body.source, target: req.body.target });
  await logEvent(req.room._id, req.user._id, 'edge-created', `${req.user.name} connected two nodes`, e._id);
  emitRoom(req, req.room._id, 'edge-created', e); res.status(201).json(e);
};
export const deleteEdge = async (req, res) => {
  await CanvasEdge.deleteOne({ _id: req.params.edgeId, roomId: req.room._id });
  await logEvent(req.room._id, req.user._id, 'edge-deleted', `${req.user.name} removed an edge`, req.params.edgeId);
  emitRoom(req, req.room._id, 'edge-deleted', { id: req.params.edgeId }); res.json({ ok: true });
};
