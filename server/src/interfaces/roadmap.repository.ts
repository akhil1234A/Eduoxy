import { Document } from "mongoose";
import { IRoadmap } from "../models/roadmap.model";

export interface IRoadmapDocument extends IRoadmap, Document {}

export interface IRoadmapRepository {
  createRoadmap(roadmap: IRoadmap): Promise<IRoadmapDocument>;
  findRoadmapById(id: string): Promise<IRoadmapDocument | null>;
  findAll(): Promise<IRoadmapDocument[]>;
  updateRoadmap(id: string, roadmap: Partial<IRoadmap>): Promise<IRoadmapDocument | null>;
  deleteRoadmap(id: string): Promise<boolean>;
  listAllRoadmap(query: string, skip: number, limit: number): Promise<IRoadmapDocument[]>;
  count(query: string): Promise<number>;
} 