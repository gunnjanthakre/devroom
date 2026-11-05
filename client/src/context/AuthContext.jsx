import { createContext, useContext, useState } from 'react';
import api from '../api.js';
const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);
// Token lives in localStorage; user state is in memory (no session restoration on refresh, as in the paper).
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const finish = ({ data }) => { localStorage.setItem('devroom_token', data.token); setUser(data.user); };
  const login = (email, password) => api.post('/auth/login', { email, password }).then(finish);
  const register = (name, email, password) => api.post('/auth/register', { name, email, password }).then(finish);
  const logout = () => { localStorage.removeItem('devroom_token'); setUser(null); };
  return <Ctx.Provider value={{ user, login, register, logout }}>{children}</Ctx.Provider>;
}
