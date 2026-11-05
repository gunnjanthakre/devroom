import { createContext, useCallback, useContext, useState } from 'react';
import api from '../api.js';
const Ctx = createContext(null);
export const useRooms = () => useContext(Ctx);
export function RoomProvider({ children }) {
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const loadRooms = useCallback(() => api.get('/rooms').then((r) => setRooms(r.data)), []);
  const createRoom = (name, description) => api.post('/rooms', { name, description }).then((r) => { setRooms((p) => [...p, r.data]); return r.data; });
  const openRoom = (id) => api.get(`/rooms/${id}`).then((r) => setActiveRoom(r.data));
  const closeRoom = () => setActiveRoom(null);
  const archiveRoom = (id) => api.delete(`/rooms/${id}`).then(() => { setRooms((p) => p.filter((r) => r._id !== id)); setActiveRoom(null); });
  return <Ctx.Provider value={{ rooms, activeRoom, loadRooms, createRoom, openRoom, closeRoom, archiveRoom }}>{children}</Ctx.Provider>;
}
