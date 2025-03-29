import { injectable } from "inversify";
import { ILiveClassRepository } from "../interfaces/liveClass.repository";
import LiveClassModel, { ILiveClass } from "../models/liveClass.model";

@injectable()
export class LiveClassRepository implements ILiveClassRepository {
  async create(liveClass: Partial<ILiveClass>): Promise<ILiveClass> {
    return await LiveClassModel.create(liveClass);
  }

  async findById(id: string): Promise<ILiveClass | null> {
    return await LiveClassModel.findById(id).exec();
  }

  async findByCourseId(courseId: string): Promise<ILiveClass[]> {
    return await LiveClassModel.find({ courseId }).exec();
  }

  async update(id: string, updates: Partial<ILiveClass>): Promise<ILiveClass | null> {
    return await LiveClassModel.findByIdAndUpdate(id, updates, { new: true }).exec();
  }

  async addParticipant(id: string, userId: string): Promise<ILiveClass | null> {
    return await LiveClassModel.findByIdAndUpdate(
      id,
      { $addToSet: { participants: userId } },
      { new: true }
    ).exec();
  }

  async removeParticipant(id: string, userId: string): Promise<ILiveClass | null> {
    return await LiveClassModel.findByIdAndUpdate(
      id,
      { $pull: { participants: userId } },
      { new: true }
    ).exec();
  }
}