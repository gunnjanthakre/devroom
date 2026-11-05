import mongoose from 'mongoose';
export default mongoose.model('User', new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  profileImage: String,
  isOnline: { type: Boolean, default: false },
}, { timestamps: true }));
