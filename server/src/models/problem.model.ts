import mongoose, { Document, Schema, Types } from 'mongoose';
import { Problem } from '../types/codeRunner.types';

export interface IProblemDocument extends Omit<Problem, '_id'>, Document {
  _id: Types.ObjectId;
}

const testCaseSchema = new Schema({
  input: { type: String, required: true },
  expectedOutput: { type: String, required: true },
  explanation: { type: String }
});

const problemSchema = new Schema<IProblemDocument>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  testCases: [testCaseSchema],
  starterCode: { type: String, required: true },
  solution: { type: String, required: true },
  category: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

problemSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model<IProblemDocument>('Problem', problemSchema);