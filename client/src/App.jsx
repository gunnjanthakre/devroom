import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import { useRooms } from './context/RoomContext.jsx';
import RoomWorkspace from './components/RoomWorkspace.jsx';

function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login'); const [f, setF] = useState({ name: '', email: '', password: '' }); const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async () => { try { setErr(''); mode === 'login' ? await login(f.email, f.password) : await register(f.name, f.email, f.password); } catch (e) { setErr(e.response?.data?.message || 'Failed'); } };
  return (<div className="center"><div className="card auth"><h1>DevRoom</h1><p className="muted">Collaborative software architecture planning</p>
    {mode === 'register' && <input placeholder="Name" value={f.name} onChange={set('name')} />}
    <input placeholder="Email" value={f.email} onChange={set('email')} /><input placeholder="Password" type="password" value={f.password} onChange={set('password')} />
    {err && <div className="err">{err}</div>}<button onClick={submit}>{mode === 'login' ? 'Log in' : 'Create account'}</button>
    <a href="#" onClick={(e) => { e.preventDefault(); setMode(mode === 'login' ? 'register' : 'login'); }}>{mode === 'login' ? 'Need an account?' : 'Have an account?'}</a></div></div>);
}

function Dashboard() {
  const { user, logout } = useAuth(); const { rooms, loadRooms, createRoom, openRoom } = useRooms();
  const [name, setName] = useState(''); const [desc, setDesc] = useState('');
  useEffect(() => { loadRooms(); }, [loadRooms]);
  return (<div className="center top"><div className="card wide"><div className="row"><h2>Your rooms</h2><span>{user.name} · <a href="#" onClick={logout}>Log out</a></span></div>
    {rooms.map((r) => <div key={r._id} className="item" onClick={() => openRoom(r._id)}><b>{r.name}</b><span className="muted">{r.description}</span><span className="tag">{r.role}</span></div>)}
    {!rooms.length && <p className="muted">No rooms yet.</p>}
    <div className="row gap"><input placeholder="New room name" value={name} onChange={(e) => setName(e.target.value)} /><input placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} />
      <button onClick={async () => { if (name) { const r = await createRoom(name, desc); setName(''); setDesc(''); openRoom(r._id); } }}>Create</button></div></div></div>);
}

export default function App() {
  const { user } = useAuth(); const { activeRoom } = useRooms();
  if (!user) return <AuthPage />;
  return activeRoom ? <RoomWorkspace /> : <Dashboard />;
}
