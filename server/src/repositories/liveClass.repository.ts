import { injectable } from "inversify";
import { ILiveClassRepository } from "../interfaces/liveClass.repository";
import LiveClassModel, { ILiveClass } from "../models/liveClass.model";

/**
 * This is a repository responsible for interacting with live class repository
 * Managing live clasess 
 */
@injectable()
export class LiveClassRepository implements ILiveClassRepository {


  async create(liveClass: Partial<ILiveClass>): Promise<ILiveClass> {
    return await LiveClassModel.create(liveClass);
  }

  async findById(id: string): Promise<ILiveClass | null> {
    return await LiveClassModel.findById(id).exec();
  }

  async findByIdAndDelete(id: string): Promise<ILiveClass | null> {
    return await LiveClassModel.findByIdAndDelete(id).exec();
  }

  /**
   * This method list all live classes specific to course in course view page 
   * @param courseId 
   * @returns 
   */
  async findByCourseId(courseId: string): Promise<ILiveClass[]> {
    return await LiveClassModel.find({ courseId }).exec();
  }

  async update(id: string, updates: Partial<ILiveClass>): Promise<ILiveClass | null> {
    return await LiveClassModel.findByIdAndUpdate(id, updates, { new: true }).exec();
  }

 /**
  * This method manages room for live chat for group of participants
  * adds a participant to the group 
  * @param id 
  * @param userId 
  * @returns 
  */
  async addParticipant(id: string, userId: string): Promise<ILiveClass | null> {
    return await LiveClassModel.findByIdAndUpdate(
      id,
      { $addToSet: { participants: userId } },
      { new: true }
    ).exec();
  }

  /**
   * This method manages room for live chat for group of participants
   * remove a participant from the group 
   * @param id 
   * @param userId 
   * @returns 
   */
  async removeParticipant(id: string, userId: string): Promise<ILiveClass | null> {
    return await LiveClassModel.findByIdAndUpdate(
      id,
      { $pull: { participants: userId } },
      { new: true }
    ).exec();
  }
}