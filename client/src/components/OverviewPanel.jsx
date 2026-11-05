import { useEffect, useState } from 'react';
import api from '../api.js';
import { useRooms } from '../context/RoomContext.jsx';
export default function OverviewPanel({ room }) {
  const { archiveRoom } = useRooms(); const [s, setS] = useState({ members: 0, files: 0, nodes: 0, edges: 0, notes: 0 });
  useEffect(() => { Promise.all([api.get(`/rooms/${room._id}/members`), api.get(`/rooms/${room._id}/files`), api.get(`/rooms/${room._id}/canvas`)])
    .then(([m, f, c]) => setS({ members: m.data.length, files: f.data.length, nodes: c.data.nodes.length, edges: c.data.edges.length, notes: c.data.notes.length })); }, [room._id]);
  return (<div className="panel"><h2>{room.name}</h2><p className="muted">{room.description || 'No description'}</p><p>Your role: <span className="tag">{room.role}</span></p>
    <div className="stats">{Object.entries(s).map(([k, v]) => <div key={k} className="stat"><b>{v}</b><span>{k}</span></div>)}</div>
    {room.role === 'owner' && <button className="danger" onClick={() => confirm('Archive this room?') && archiveRoom(room._id)}>Archive room</button>}</div>);
}
