import mongoose, { Schema, Document } from "mongoose";

export interface IResource {
  id: string;
  title: string;
  url: string;
}

export interface ITopic {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isInterviewTopic: boolean;
  interviewQuestions: string[];
  resources: IResource[];
}

export interface ISection {
  id: string;
  title: string;
  topics: ITopic[];
}

export interface IRoadmap extends Document {
  title: string;
  description: string;
  sections: ISection[];
  createdAt?: Date;
  updatedAt?: Date;
}

export type IRoadmapDocument = IRoadmap & Document;

// Subschemas
const ResourceSchema = new Schema<IResource>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false }
);

const TopicSchema = new Schema<ITopic>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    isCompleted: { type: Boolean, default: false },
    isInterviewTopic: { type: Boolean, default: false },
    interviewQuestions: { type: [String], default: [] },
    resources: { type: [ResourceSchema], default: [] },
  },
  { _id: false }
);

const SectionSchema = new Schema<ISection>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    topics: { type: [TopicSchema], default: [] },
  },
  { _id: false }
);

const RoadmapSchema = new Schema<IRoadmap>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    sections: { type: [SectionSchema], default: [] },
  },
  { timestamps: true }
);

const Roadmap = mongoose.model<IRoadmap>("Roadmap", RoadmapSchema);
export default Roadmap;
