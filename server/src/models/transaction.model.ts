import { Schema, model, Document } from "mongoose";

export interface ITransaction extends Document {
  userId: string;
  transactionId: string;
  dateTime: string;
  courseId: string;
  paymentProvider: "stripe";
  amount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: String,
      required: true,
      index: true, 
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    dateTime: {
      type: String,
      required: true,
    },
    courseId: {
      type: String,
      required: true,
      index: true, 
    },
    paymentProvider: {
      type: String,
      enum: ["stripe"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true, 
  }
);

const Transaction = model<ITransaction>("Transaction", transactionSchema);
export default Transaction;