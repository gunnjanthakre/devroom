import { Router } from 'express';
import auth from '../middleware/authMiddleware.js';
import { can } from '../utils/permissions.js';
import * as rc from '../controllers/roomController.js';
import * as cc from '../controllers/canvasController.js';
import * as fc from '../controllers/fileController.js';
const r = Router(); r.use(auth);
r.get('/', rc.listRooms); r.post('/', rc.createRoom);
r.get('/:roomId', can('view'), rc.getRoom); r.delete('/:roomId', can('manage'), rc.archiveRoom);
// members
r.get('/:roomId/members', can('view'), rc.listMembers); r.post('/:roomId/members', can('invite'), rc.inviteMember);
r.patch('/:roomId/members/:userId', can('manage'), rc.changeRole); r.delete('/:roomId/members/:userId', can('manage'), rc.removeMember);
// canvas
r.get('/:roomId/canvas', can('view'), cc.getCanvas); r.put('/:roomId/canvas', can('edit'), cc.saveCanvas);
r.post('/:roomId/nodes', can('edit'), cc.createNode); r.delete('/:roomId/nodes/:nodeId', can('edit'), cc.deleteNode);
r.post('/:roomId/edges', can('edit'), cc.createEdge); r.delete('/:roomId/edges/:edgeId', can('edit'), cc.deleteEdge);
// files (JWT + RBAC enforced)
r.get('/:roomId/files', can('view'), fc.listFiles); r.post('/:roomId/files', can('edit'), fc.uploadFile);
r.get('/:roomId/file-links', can('view'), fc.linksForRoom);
r.get('/:roomId/files/:fileId', can('view'), fc.getFile); r.put('/:roomId/files/:fileId', can('edit'), fc.updateFile);
r.get('/:roomId/files/:fileId/versions', can('view'), fc.listVersions);
r.post('/:roomId/files/:fileId/versions/:version/restore', can('edit'), fc.restoreVersion);
r.post('/:roomId/files/:fileId/link', can('edit'), fc.linkFile);
r.get('/:roomId/nodes/:nodeId/files', can('view'), fc.filesForNode);
// history
r.get('/:roomId/history', can('view'), rc.listHistory);
export default r;
