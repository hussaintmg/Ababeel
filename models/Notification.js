import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: [true, 'message is required'],
    trim: true,
  },
  isSeen: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
NotificationSchema.index({ userId: 1 });
NotificationSchema.index({ isActive: 1 });
NotificationSchema.index({ createdAt: -1 });

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);