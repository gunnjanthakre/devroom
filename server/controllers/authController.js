import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
const sign = (u) => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
const pub = (u) => ({ id: u._id, name: u.name, email: u.email, profileImage: u.profileImage });
export const register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'name, email, password required' });
  if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ message: 'Email already registered' });
  const u = await User.create({ name, email, password: await bcrypt.hash(password, 12) });
  res.status(201).json({ token: sign(u), user: pub(u) });
};
export const login = async (req, res) => {
  const u = await User.findOne({ email: (req.body.email || '').toLowerCase() });
  if (!u || !(await bcrypt.compare(req.body.password || '', u.password))) return res.status(401).json({ message: 'Invalid credentials' });
  res.json({ token: sign(u), user: pub(u) });
};
