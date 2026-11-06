import mongoose from "mongoose"

const ContactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    lowercase: true,
    trim: true,
  },
  subject: {
    type: String,
    required: [true, "Subject is required"],
  },
  message: {
    type: String,
    required: [true, "Message is required"],
  },
  // Sender IP, used only for rate limiting
  ip: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: ["pending", "replied", "closed"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

ContactSchema.index({ email: 1, createdAt: -1 })
ContactSchema.index({ ip: 1, createdAt: -1 })

export default mongoose.models.Contact || mongoose.model("Contact", ContactSchema)
