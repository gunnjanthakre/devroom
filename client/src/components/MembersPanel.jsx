import { useCallback, useEffect, useState } from 'react';
import api from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
export default function MembersPanel({ room }) {
  const { user } = useAuth(); const [ms, setMs] = useState([]); const [email, setEmail] = useState(''); const [role, setRole] = useState('viewer'); const [err, setErr] = useState('');
  const load = useCallback(() => api.get(`/rooms/${room._id}/members`).then((r) => setMs(r.data)), [room._id]); useEffect(() => { load(); }, [load]);
  const owner = room.role === 'owner', canInvite = room.role !== 'viewer';
  const run = (p) => p.then(() => { setErr(''); load(); }).catch((e) => setErr(e.response?.data?.message || 'Failed'));
  return (<div className="panel"><h2>Members</h2>{err && <div className="err">{err}</div>}
    {ms.map((m) => <div key={m._id} className="item"><b>{m.userId.name}</b><span className="muted">{m.userId.email}</span>
      {owner && m.userId._id !== user.id ? <><select value={m.role} onChange={(e) => run(api.patch(`/rooms/${room._id}/members/${m.userId._id}`, { role: e.target.value }))}>
        <option>owner</option><option>editor</option><option>viewer</option></select><button className="danger" onClick={() => run(api.delete(`/rooms/${room._id}/members/${m.userId._id}`))}>Remove</button></> : <span className="tag">{m.role}</span>}</div>)}
    {canInvite && <div className="row gap"><input placeholder="Invite by email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <select value={role} onChange={(e) => setRole(e.target.value)}><option>viewer</option><option>editor</option></select>
      <button onClick={() => run(api.post(`/rooms/${room._id}/members`, { email, role }).then(() => setEmail('')))}>Invite</button></div>}</div>);
}
