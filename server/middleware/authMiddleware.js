import jwt from 'jsonwebtoken';
import User from '../models/User.js';
export default async function authMiddleware(req, res, next) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return res.status(401).json({ message: 'Missing token' });
  try {
    const { id } = jwt.verify(h.slice(7), process.env.JWT_SECRET);
    const user = await User.findById(id).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = user; next();
  } catch { res.status(401).json({ message: 'Invalid token' }); }
}
