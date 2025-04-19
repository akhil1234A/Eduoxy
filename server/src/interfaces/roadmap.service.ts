import { IRoadmap, IRoadmapDocument } from "../models/roadmap.model";

export interface IRoadmapService {
  createRoadmap(roadmap: IRoadmap): Promise<IRoadmapDocument>;
  getRoadmapById(id: string): Promise<IRoadmapDocument | null>;
  getAllRoadmaps(page: number, limit: number, searchTerm: string): Promise<{
    roadmaps: IRoadmapDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  updateRoadmap(id: string, roadmap: Partial<IRoadmap>): Promise<IRoadmapDocument | null>;
  deleteRoadmap(id: string): Promise<boolean>;
  updateTopicProgress(roadmapId: string, sectionId: string, topicId: string, isCompleted: boolean): Promise<IRoadmapDocument | null>;
} 