import { IRoadmap, IRoadmapDocument } from "../models/roadmap.model";

export interface IRoadmapService {
  createRoadmap(roadmap: IRoadmap): Promise<IRoadmapDocument>;
  getRoadmapById(id: string): Promise<IRoadmapDocument | null>;
  getAllRoadmaps(): Promise<IRoadmapDocument[]>;
  updateRoadmap(id: string, roadmap: Partial<IRoadmap>): Promise<IRoadmapDocument | null>;
  deleteRoadmap(id: string): Promise<boolean>;
  updateTopicProgress(roadmapId: string, sectionId: string, topicId: string, isCompleted: boolean): Promise<IRoadmapDocument | null>;
} 