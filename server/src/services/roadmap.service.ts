import { inject, injectable } from "inversify";
import { IRoadmapService } from "../interfaces/roadmap.service";
import { IRoadmapRepository } from "../interfaces/roadmap.repository";
import TYPES from "../di/types";
import { IRoadmap, IRoadmapDocument } from "../models/roadmap.model";

@injectable()
export class RoadmapService implements IRoadmapService {
  constructor(@inject(TYPES.IRoadmapRepository) private _roadmapRepository: IRoadmapRepository) {}

  async createRoadmap(roadmap: IRoadmap): Promise<IRoadmapDocument> {
    return this._roadmapRepository.create(roadmap);
  }

  async getRoadmapById(id: string): Promise<IRoadmapDocument | null> {
    return this._roadmapRepository.findById(id);
  }

   async getAllRoadmaps(page: number = 1, limit: number = 10, searchTerm: string = ""): Promise<{
    roadmaps: IRoadmapDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const query = searchTerm
      ? {
          $or: [
            { title: { $regex: searchTerm, $options: "i" } },
            { description: { $regex: searchTerm, $options: "i" } },
          ],
        }
      : {};

    const [roadmaps, total] = await Promise.all([
      this._roadmapRepository.find(query, skip, limit),
      this._roadmapRepository.count(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      roadmaps,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async updateRoadmap(id: string, roadmap: Partial<IRoadmap>): Promise<IRoadmapDocument | null> {
    return this._roadmapRepository.update(id, roadmap);
  }

  async deleteRoadmap(id: string): Promise<boolean> {
    return this._roadmapRepository.delete(id);
  }

  async updateTopicProgress(
    roadmapId: string,
    sectionId: string,
    topicId: string,
    isCompleted: boolean
  ): Promise<IRoadmapDocument | null> {
    const roadmap = await this._roadmapRepository.findById(roadmapId);
    if (!roadmap) return null;

    const section = roadmap.sections.find((s) => s.id === sectionId);
    if (!section) return null;

    const topic = section.topics.find((t) => t.id === topicId);
    if (!topic) return null;

    topic.isCompleted = isCompleted;
    return this._roadmapRepository.update(roadmapId, roadmap);
  }
} 