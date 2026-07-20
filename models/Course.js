import mongoose from 'mongoose';

const CourseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true,
    minlength: [3, 'Course name must be at least 3 characters'],
    maxlength: [200, 'Course name cannot exceed 200 characters']
  },
  price: {
    type: Number,
    required: [true, 'Course price is required'],
    min: [0, 'Price cannot be negative'],
    max: [999999.99, 'Price is too high']
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    trim: true
  },
  currencySymbol: {
    type: String,
    required: [true, 'Currency symbol is required'],
    trim: true
  },
  currencyCode: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
CourseSchema.index({ userId: 1 });
CourseSchema.index({ isActive: 1 });
CourseSchema.index({ createdAt: -1 });

export default mongoose.models.Course || mongoose.model('Course', CourseSchema);