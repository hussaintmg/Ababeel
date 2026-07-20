import mongoose from 'mongoose';

const DepositSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  stripePaymentId: {
    type: String,
    required: true,
  },
  stripeCustomerId: {
    type: String,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'canceled'],
    default: 'pending',
  },
  currency: {
    type: String,
    default: 'gbp',
  },
  paymentMethod: {
    type: String,
  },
  receiptUrl: {
    type: String,
  },
  description: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

DepositSchema.pre('save', async function () {
  this.updatedAt = Date.now();
});

export default mongoose.models.Deposit || mongoose.model('Deposit', DepositSchema);