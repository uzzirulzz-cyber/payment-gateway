import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Order schema — mirrors the previous Prisma Order model.
 *
 * Status values: pending | paid | failed | cancelled | refunded
 */
const OrderSchema = new Schema(
  {
    txnRefNo: { type: String, required: true, unique: true, index: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    customerEmail: { type: String, default: null },
    customerName: { type: String, default: null },
    customerPhone: { type: String, default: null },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "cancelled", "refunded"],
      default: "pending",
      index: true,
    },
    responseCode: { type: String, default: null },
    responseMessage: { type: String, default: null },
    paymentMethod: { type: String, default: null },
    transactionId: { type: String, default: null },
    rawResponse: { type: String, default: null },
    receiptSentAt: { type: Date, default: null },
    refundedAt: { type: Date, default: null },
    refundReason: { type: String, default: null },
  },
  { timestamps: true }, // createdAt + updatedAt
);

export type OrderDoc = InferSchemaType<typeof OrderSchema>;
export type OrderModel = Model<OrderDoc>;

export const Order =
  (mongoose.models.Order as OrderModel) ||
  mongoose.model<OrderDoc>("Order", OrderSchema);
