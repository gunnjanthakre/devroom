import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext.jsx';
import { useRooms } from '../context/RoomContext.jsx';
import { socketRef } from '../api.js';
import ReactFlowCanvas from './ReactFlowCanvas.jsx';
import OverviewPanel from './OverviewPanel.jsx';
import FilesPanel from './FilesPanel.jsx';
import MembersPanel from './MembersPanel.jsx';
import HistoryPanel from './HistoryPanel.jsx';

const TABS = ['Canvas', 'Overview', 'Files', 'Members', 'History'];
export default function RoomWorkspace() {
  const { user } = useAuth(); const { activeRoom: room, closeRoom } = useRooms();
  const [tab, setTab] = useState('Canvas'); const [socket, setSocket] = useState(null); const [online, setOnline] = useState([]);
  useEffect(() => {
    const s = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
    s.on('connected', ({ socketId }) => { socketRef.id = socketId; });
    s.on('connect', () => s.emit('presence-join', { userId: user.id, name: user.name, roomId: room._id }));
    s.on('presence-update', setOnline); setSocket(s);
    return () => { s.disconnect(); socketRef.id = null; };
  }, [room._id, user.id, user.name]);
  return (<div className="ws"><header className="bar"><button className="ghost" onClick={closeRoom}>← Rooms</button><b>{room.name}</b>
    <nav>{TABS.map((t) => <a key={t} className={t === tab ? 'on' : ''} onClick={() => setTab(t)}>{t}</a>)}</nav>
    <div className="avatars">{online.map((u) => <span key={u.userId} className="av" title={u.name}>{u.name[0].toUpperCase()}</span>)}</div></header>
    <main className="body">
      <div style={{ display: tab === 'Canvas' ? 'block' : 'none', height: '100%' }}>{socket && <ReactFlowCanvas room={room} socket={socket} online={online} />}</div>
      {tab === 'Overview' && <OverviewPanel room={room} />}{tab === 'Files' && <FilesPanel room={room} />}
      {tab === 'Members' && <MembersPanel room={room} />}{tab === 'History' && <HistoryPanel room={room} />}
    </main></div>);
}
