import { inject, injectable } from "inversify";
import { IRoadmapService } from "../interfaces/roadmap.service";
import { IRoadmapRepository } from "../interfaces/roadmap.repository";
import TYPES from "../di/types";
import { IRoadmap, IRoadmapDocument } from "../models/roadmap.model";

/**
 * This is a service responsible for managing roadmap functionalities
 * It handles creating, retrieving, updating, and deleting roadmaps
 */
@injectable()
export class RoadmapService implements IRoadmapService {
  constructor(@inject(TYPES.IRoadmapRepository) private _roadmapRepository: IRoadmapRepository) {}

  /**
   * This method creates a new roadmap for a course
   * @param roadmap 
   * @returns 
   */
  async createRoadmap(roadmap: IRoadmap): Promise<IRoadmapDocument> {
    return this._roadmapRepository.createRoadmap(roadmap);
  }

  /**
   * This method retrieves a roadmap by id
   * @param id 
   * @returns 
   */
  async getRoadmapById(id: string): Promise<IRoadmapDocument | null> {
    return this._roadmapRepository.findRoadmapById(id);
  }

  /**
   * This method retrieves all roadmaps with pagination and search functionality
   * @param page 
   * @param limit 
   * @param searchTerm 
   * @returns 
   */
  async getAllRoadmaps(page: number = 1, limit: number = 10, searchTerm: string = ""): Promise<{
    roadmaps: IRoadmapDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const query: any = searchTerm
      ? {
          $or: [
            { title: { $regex: searchTerm, $options: "i" } },
            { description: { $regex: searchTerm, $options: "i" } },
          ],
        }
      : {};

    const [roadmaps, total] = await Promise.all([
      this._roadmapRepository.listAllRoadmap(query as any, skip, limit),
      this._roadmapRepository.count(query as any),
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

  /**
   * This method updates the roadmap by id
   * @param id 
   * @param roadmap 
   * @returns 
   */
  async updateRoadmap(id: string, roadmap: Partial<IRoadmap>): Promise<IRoadmapDocument | null> {
    return this._roadmapRepository.updateRoadmap(id, roadmap);
  }

  /** 
   * This method deletes a roadmap by id
   * @param id
   */
  async deleteRoadmap(id: string): Promise<boolean> {
    return this._roadmapRepository.deleteRoadmap(id);
  }

  /**
   * This method updates the progress of a topic in a roadmap
   * @param roadmapId 
   * @param sectionId 
   * @param topicId 
   * @param isCompleted 
   * @returns 
   */
  async updateTopicProgress(
    roadmapId: string,
    sectionId: string,
    topicId: string,
    isCompleted: boolean
  ): Promise<IRoadmapDocument | null> {
    const roadmap = await this._roadmapRepository.findRoadmapById(roadmapId);
    if (!roadmap) return null;

    const section = roadmap.sections.find((s) => s.id === sectionId);
    if (!section) return null;

    const topic = section.topics.find((t) => t.id === topicId);
    if (!topic) return null;

    topic.isCompleted = isCompleted;
    return this._roadmapRepository.updateRoadmap(roadmapId, roadmap);
  }
}