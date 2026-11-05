# DevRoom: A Collaborative Software Architecture Planning Workspace

MERN-style stack from the paper: React 19 + Vite + React Flow (client), Node.js + Express 5 + Mongoose + Socket.IO (server), MongoDB, JWT + bcrypt.

Features: rooms; typed draggable nodes + directed edges; sticky notes; live presence & remote cursors; owner/editor/viewer RBAC (Table III);
file upload with versioning and file<->node links; chronological history log; snapshot-replacement canvas persistence with temp-ID mapping;
server-authoritative optimistic consistency (`canvas-updated` triggers a re-fetch).

## Run
```bash
# 1) MongoDB running locally (or set MONGO_URI)
cd server && cp .env.example .env && npm install && npm run dev        # http://localhost:5000
cd client && cp .env.example .env && npm install && npm run dev        # http://localhost:5173
```
Open two browsers, register two users, create a room, invite the second user by email.

## Socket events
Client->server: `presence-join`, `cursor-move`, `node-drag`, `note-drag`. Server->client: `presence-update`, `cursor-move`, `node-drag`, `note-drag`,
`node-created`, `node-deleted`, `edge-created`, `edge-deleted`, `canvas-updated`.

## Differences from the paper's "Limitations"
- File endpoints are protected by JWT + RBAC here (the paper lists them as unauthenticated).
- Frontend session restoration after refresh is intentionally not implemented, matching the paper.
- Snapshot save is not wrapped in a Mongo transaction (needs a replica set).
- The latency/RBAC/persistence figures in the paper come from the authors' own tests; this repo doesn't include those test scripts.
