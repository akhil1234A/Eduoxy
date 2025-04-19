import { inject, injectable } from "inversify";
import { Model } from "mongoose";
import { BaseRepository } from "./base.repository";
import { IRoadmapDocument, IRoadmapRepository } from "../interfaces/roadmap.repository";
import TYPES from "../di/types";

@injectable()
export class RoadmapRepository extends BaseRepository<IRoadmapDocument> implements IRoadmapRepository {
  constructor(@inject(TYPES.RoadmapModel) model: Model<IRoadmapDocument>) {
    super(model);
  }

  async create(roadmap: any): Promise<IRoadmapDocument> {
    return this.model.create(roadmap);
  }

  async findById(id: string): Promise<IRoadmapDocument | null> {
    return this.model.findById(id).exec();
  }

  async find(query: any = {}, skip: number = 0, limit: number = 10): Promise<IRoadmapDocument[]> {
    return this.model.find(query).skip(skip).limit(limit).exec();
  }

  async count(query: any = {}): Promise<number> {
    return this.model.countDocuments(query).exec();
  }

  async update(id: string, roadmap: any): Promise<IRoadmapDocument | null> {
    return this.model.findByIdAndUpdate(id, roadmap, { new: true }).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return !!result;
  }
} 