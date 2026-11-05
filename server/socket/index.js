// Hub-and-spoke broadcast. Client->server events: presence-join, cursor-move, node-drag, note-drag.
// Server->client: presence-update, cursor-move, node-drag, note-drag (+ REST-triggered node/edge/canvas events).
export default function initSocket(io) {
  const presence = new Map();                       // roomId -> Map(socketId -> {userId, name}) (in-memory only)
  const roster = (roomId) => {
    const seen = new Map(); for (const u of presence.get(roomId)?.values() ?? []) seen.set(u.userId, u);
    io.to(roomId).emit('presence-update', [...seen.values()]);
  };
  io.on('connection', (s) => {
    s.emit('connected', { socketId: s.id });
    s.on('presence-join', ({ userId, name, roomId }) => {
      roomId = String(roomId); s.data = { roomId, userId, name }; s.join(roomId);
      if (!presence.has(roomId)) presence.set(roomId, new Map());
      presence.get(roomId).set(s.id, { userId, name }); roster(roomId);
    });
    s.on('cursor-move', ({ x, y }) => s.data.roomId && s.to(s.data.roomId).emit('cursor-move', { userId: s.data.userId, name: s.data.name, x, y }));
    s.on('node-drag', (p) => s.data.roomId && s.to(s.data.roomId).emit('node-drag', p));
    s.on('note-drag', (p) => s.data.roomId && s.to(s.data.roomId).emit('note-drag', p));
    s.on('disconnect', () => {
      const r = s.data?.roomId; if (!r) return;
      presence.get(r)?.delete(s.id); if (!presence.get(r)?.size) presence.delete(r); roster(r);
    });
  });
}
