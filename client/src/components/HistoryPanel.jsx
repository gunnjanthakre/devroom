import { useEffect, useState } from 'react';
import api from '../api.js';
export default function HistoryPanel({ room }) {
  const [logs, setLogs] = useState([]);
  useEffect(() => { api.get(`/rooms/${room._id}/history`).then((r) => setLogs(r.data)); }, [room._id]);
  return (<div className="panel"><h2>Activity history</h2>{logs.map((l) => <div key={l._id} className="item"><b>{l.userId?.name || 'Unknown'}</b>
    <span>{l.message}</span><span className="muted">{new Date(l.createdAt).toLocaleString()}</span></div>)}{!logs.length && <p className="muted">No activity yet.</p>}</div>);
}
