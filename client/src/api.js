import axios from 'axios';
export const socketRef = { id: null };   // lets the server skip echoing events back to the sender
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' });
api.interceptors.request.use((c) => {
  const t = localStorage.getItem('devroom_token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  if (socketRef.id) c.headers['x-socket-id'] = socketRef.id;
  return c;
});
export default api;
