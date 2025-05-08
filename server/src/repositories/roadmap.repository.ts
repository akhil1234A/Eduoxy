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
  async create(roadmap: any): Promise<IRoadmapDocument> {
    return this.model.create(roadmap);
  }

/**
 * This method retrieves roadmap by id 
 * @param id 
 * @returns 
 */
  async findById(id: string): Promise<IRoadmapDocument | null> {
    return this.model.findById(id).exec();
  }

  /**
   * This method retrieves all roadmaps
   * @param query 
   * @param skip 
   * @param limit 
   * @returns 
   */
  async find(query: any = {}, skip: number = 0, limit: number = 10): Promise<IRoadmapDocument[]> {
    return this.model.find(query).skip(skip).limit(limit).exec();
  }

/**
 * This method exist for pagination purpose, count the number of roadmaps
 * @param query 
 * @returns 
 */
  async count(query: any = {}): Promise<number> {
    return this.model.countDocuments(query).exec();
  }

  /**
   * This method updates a roadmap by id
   * @param id 
   * @param roadmap 
   * @returns 
   */

  async update(id: string, roadmap: any): Promise<IRoadmapDocument | null> {
    return this.model.findByIdAndUpdate(id, roadmap, { new: true }).exec();
  }

/**
 * This method deletes a roadmap by id
 * @param id 
 * @returns 
 */
  async delete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return !!result;
  }
} 