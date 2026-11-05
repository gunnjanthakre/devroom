import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import initSocket from './socket/index.js';

const app = express();
const origin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin })); app.use(express.json({ limit: '5mb' }));
app.use('/api/auth', authRoutes); app.use('/api/rooms', roomRoutes);
app.use((err, req, res, next) => { console.error(err); res.status(err.status || 500).json({ message: err.message || 'Server error' }); });

const server = http.createServer(app);
const io = new Server(server, { cors: { origin } });
app.set('io', io); initSocket(io);
await connectDB();
server.listen(process.env.PORT || 5000, () => console.log('DevRoom API on', process.env.PORT || 5000));
