// models/Invoice.js
import mongoose from "mongoose";

const InvoiceSchema = new mongoose.Schema(
  {
    // Invoice details
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    invoiceDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },

    // Course reference
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseReference",
      required: false,
    },

    // Amount details
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    balanceDue: {
      type: Number,
      required: true,
    },

    // Payment details
    paymentStatus: {
      type: String,
      enum: ["pending", "partially_paid", "paid", "overdue", "cancelled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: [
        "account_balance",
        "bank_transfer",
        "credit_card",
        "cash",
        "other",
        "stripe",
      ],
      default: "account_balance",
    },

    // Payment transactions
    transactions: [
      {
        date: { type: Date, default: Date.now },
        amount: { type: Number, required: true },
        paymentMethod: { type: String },
        transactionId: { type: String },
        notes: { type: String },
      },
    ],

    // Client info
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    clientName: { type: String, required: true },
    clientEmail: { type: String },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  },
);

InvoiceSchema.pre("save", async function () {
  this.balanceDue = this.totalAmount - this.amountPaid;

  if (this.balanceDue <= 0) {
    this.paymentStatus = "paid";
  } else if (this.amountPaid > 0) {
    this.paymentStatus = "partially_paid";
  } else {
    this.paymentStatus = "pending";
  }

  this.updatedAt = Date.now();
});

export default mongoose.models.Invoice ||
  mongoose.model("Invoice", InvoiceSchema);
