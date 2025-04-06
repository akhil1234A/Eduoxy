import { Document } from "mongoose";
import { IRoadmap } from "../models/roadmap.model";

export interface IRoadmapDocument extends IRoadmap, Document {}

export interface IRoadmapRepository {
  create(roadmap: IRoadmap): Promise<IRoadmapDocument>;
  findById(id: string): Promise<IRoadmapDocument | null>;
  findAll(): Promise<IRoadmapDocument[]>;
  update(id: string, roadmap: Partial<IRoadmap>): Promise<IRoadmapDocument | null>;
  delete(id: string): Promise<boolean>;
} 