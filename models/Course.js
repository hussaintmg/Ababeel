// models/Course.js
import mongoose from 'mongoose';
import { slugify } from '@/lib/models/shared';

const GalleryImageSchema = new mongoose.Schema(
  {
    url: { type: String, default: '', trim: true },
    alt: { type: String, default: '', trim: true },
    caption: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const FaqItemSchema = new mongoose.Schema(
  {
    question: { type: String, default: '', trim: true },
    answer: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const CourseSeoSchema = new mongoose.Schema(
  {
    title: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    ogImage: { type: String, default: '', trim: true },
    keywords: { type: String, default: '', trim: true },
    noIndex: { type: Boolean, default: false },
  },
  { _id: false }
);

const CourseSchema = new mongoose.Schema(
  {
    // User / Organization owner (optional for global courses, set for custom org courses)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },

    name: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
      minlength: [3, 'Course name must be at least 3 characters'],
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
      trim: true,
    },
    currencySymbol: {
      type: String,
      default: '£',
      trim: true,
    },
    currencyCode: {
      type: String,
      default: 'GBP',
      trim: true,
    },
    country: {
      type: String,
      default: 'United Kingdom',
      trim: true,
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
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'draft', 'published', 'archived'],
      default: 'active',
      index: true,
    },

    seo: {
      type: CourseSeoSchema,
      default: () => ({}),
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

CourseSchema.pre('validate', function ensureSlug() {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }
});

CourseSchema.index({ status: 1, displayOrder: 1, name: 1 });
CourseSchema.index({ name: 'text', shortDescription: 'text', code: 'text' });

const Course = mongoose.models.Course || mongoose.model('Course', CourseSchema);

export default Course;