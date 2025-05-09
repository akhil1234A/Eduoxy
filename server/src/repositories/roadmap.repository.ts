import { inject, injectable } from "inversify";
import { Model } from "mongoose";
import { BaseRepository } from "./base.repository";
import { IRoadmapDocument, IRoadmapRepository } from "../interfaces/roadmap.repository";
import TYPES from "../di/types";

/**
 * This is a repository responsible for interacting with roadmap repository
 * Managing roadmaps for courses and instructors
 */
@injectable()
export class RoadmapRepository extends BaseRepository<IRoadmapDocument> implements IRoadmapRepository {
  constructor(@inject(TYPES.RoadmapModel) model: Model<IRoadmapDocument>) {
    super(model);
  }

  /**
   * This method creates a new roadmap for a course
   * @param roadmap 
   * @returns 
   */
  async createRoadmap(roadmap: IRoadmapDocument): Promise<IRoadmapDocument> {
    return this.model.create(roadmap);
  }

/**
 * This method retrieves roadmap by id 
 * @param id 
 * @returns 
 */
  async findRoadmapById(id: string): Promise<IRoadmapDocument | null> {
    return this.model.findById(id).exec();
  }

  /**
   * This method retrieves all roadmaps
   * @param query 
   * @param skip 
   * @param limit 
   * @returns 
   */
  async listAllRoadmap(query = {}, skip: number = 0, limit: number = 10): Promise<IRoadmapDocument[]> {
    return this.model.find(query).skip(skip).limit(limit).exec();
  }

/**
 * This method exist for pagination purpose, count the number of roadmaps
 * @param query 
 * @returns 
 */
  async count(query ={}): Promise<number> {
    return this.model.countDocuments(query).exec();
  }

  /**
   * This method updates a roadmap by id
   * @param id 
   * @param roadmap 
   * @returns 
   */

  async updateRoadmap(id: string, roadmap: IRoadmapDocument): Promise<IRoadmapDocument | null> {
    return this.model.findByIdAndUpdate(id, roadmap, { new: true }).exec();
  }

/**
 * This method deletes a roadmap by id
 * @param id 
 * @returns 
 */
  async deleteRoadmap(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return !!result;
  }
} 