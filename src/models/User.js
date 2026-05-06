import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpiry: { type: Date },
  resetToken: { type: String },
  resetTokenExpiry: { type: Date },
  currency: { type: String, default: 'INR' },
  theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
