import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 60 },
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },

  // One-time code (email verification / password reset)
  otp: { type: String },
  otpExpiry: { type: Date },
  otpAttempts: { type: Number, default: 0 },
  otpSentAt: { type: Date },

  // Password reset token issued after the reset code is verified
  resetToken: { type: String },
  resetTokenExpiry: { type: Date },

  // Login brute-force protection
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  passwordChangedAt: { type: Date },

  currency: { type: String, default: 'INR', match: /^[A-Z]{3}$/ },
  theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' }
}, { timestamps: true });

// Fields that must never be sent to the browser
export const PRIVATE_USER_FIELDS = '-password -otp -otpExpiry -otpAttempts -otpSentAt -resetToken -resetTokenExpiry -failedLoginAttempts -lockUntil';

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
