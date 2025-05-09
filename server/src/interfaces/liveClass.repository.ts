import { ILiveClass } from "../models/liveClass.model";

export interface ILiveClassRepository {
  createLiveClass(liveClass: Partial<ILiveClass>): Promise<ILiveClass>;
  findLiveClassById(id: string): Promise<ILiveClass | null>;
  findLiveClassByIdAndDelete(id: string): Promise<ILiveClass | null>;
  findByCourseId(courseId: string): Promise<ILiveClass[]>;
  update(id: string, updates: Partial<ILiveClass>): Promise<ILiveClass | null>;
  addParticipant(id: string, userId: string): Promise<ILiveClass | null>;
  removeParticipant(id: string, userId: string): Promise<ILiveClass | null>;
}