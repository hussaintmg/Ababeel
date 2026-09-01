// models/DefaultCourse.js
import mongoose from 'mongoose';
import { slugify } from '@/lib/models/shared';

const GalleryImageSchema = new mongoose.Schema(
  {
    url: { type: String, default: "", trim: true },
    alt: { type: String, default: "", trim: true },
    caption: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const FaqItemSchema = new mongoose.Schema(
  {
    question: { type: String, default: "", trim: true },
    answer: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const defaultCourseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
      maxlength: [200, 'Course name cannot exceed 200 characters'],
    },
    code: { type: String, default: '', trim: true, maxlength: 40, index: true },
    slug: { type: String, trim: true, lowercase: true, index: true },

    shortDescription: { type: String, default: '', trim: true, maxlength: 500 },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 30000,
    },

    price: {
      type: Number,
      default: 0,
      min: [0, 'Price cannot be negative'],
    },
    currency: {
      type: String,
      default: 'GBP',
    },
    currencySymbol: {
      type: String,
      default: '£',
    },
    currencyCode: {
      type: String,
      default: 'GBP',
    },
    country: {
      type: String,
      default: 'United Kingdom',
    },

    level: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CourseLevel',
      default: null,
      index: true,
    },
    awardingBody: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AwardingBody',
      default: null,
      index: true,
    },
    category: { type: String, default: '', trim: true, maxlength: 100, index: true },

    duration: { type: String, default: '', trim: true, maxlength: 100 },
    durationDays: { type: Number, default: 0, min: 0 },

    featuredImage: { type: String, default: '', trim: true },
    gallery: { type: [GalleryImageSchema], default: [] },

    certificateImage: { type: String, default: '', trim: true },
    certificationInfo: { type: String, default: '', trim: true, maxlength: 4000 },

    courseContent: { type: String, default: '', trim: true, maxlength: 30000 },
    learningOutcomes: { type: String, default: '', trim: true, maxlength: 20000 },
    requirements: { type: String, default: '', trim: true, maxlength: 20000 },
    whoShouldAttend: { type: String, default: '', trim: true, maxlength: 20000 },

    faqs: { type: [FaqItemSchema], default: [] },

    featured: { type: Boolean, default: false, index: true },
    displayOrder: { type: Number, default: 0, index: true },

    isDefaultCourse: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'draft', 'published', 'archived'],
      default: 'active',
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

defaultCourseSchema.pre('validate', function ensureSlug() {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }
});

defaultCourseSchema.index({ status: 1, displayOrder: 1, name: 1 });
defaultCourseSchema.index({ name: 'text', shortDescription: 'text', code: 'text' });

const DefaultCourse =
  mongoose.models.DefaultCourse || mongoose.model('DefaultCourse', defaultCourseSchema);

export default DefaultCourse;