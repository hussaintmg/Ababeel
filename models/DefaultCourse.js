// models/Course.js
import mongoose from 'mongoose';

const defaultCourseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true,
    maxlength: [200, 'Course name cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Course price is required'],
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    default: 'GBP'
  },
  currencySymbol: {
    type: String,
    default: '£'
  },
  currencyCode: {
    type: String,
    default: 'GBP'
  },
  country: {
    type: String,
    default: 'United Kingdom'
  },
  // Default course indicator
  isDefaultCourse: {
    type: Boolean,
    default: true
  },
  // Course status
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft'],
    default: 'active'
  },
  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const DefaultCourse = mongoose.models.DefaultCourse || mongoose.model('DefaultCourse', defaultCourseSchema);

export default DefaultCourse;