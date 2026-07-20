import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  full_name: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  company: {
    type: String,
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  inquiry_type: {
    type: String,
    required: [true, 'Inquiry type is required'],
    enum: ['Organization', 'Certification', 'Complaint', 'Other']
  },
  country: {
    type: String,
    required: [true, 'Country is required']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'read'],
    default: 'pending'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Create index for faster queries
contactSchema.index({ email: 1 });
contactSchema.index({ status: 1 });
contactSchema.index({ created_at: -1 });

// Middleware to update updated_at
contactSchema.pre('save', async function() {
  this.updated_at = Date.now();
});

// Static method to get contact count by status
contactSchema.statics.getCountByStatus = async function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

// Instance method to mark as read
contactSchema.methods.markAsRead = function() {
  this.status = 'read';
  return this.save();
};

// Instance method to mark as replied
contactSchema.methods.markAsReplied = function() {
  this.status = 'replied';
  return this.save();
};

export default mongoose.models.Contact || mongoose.model('Contact', contactSchema);