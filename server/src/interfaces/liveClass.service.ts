import { ILiveClass } from "../models/liveClass.model";

export interface ILiveClassService {
  createLiveClass(courseId: string, teacherId: string, title: string, startTime: string, endTime: string): Promise<ILiveClass>;
  getSchedule(courseId: string): Promise<ILiveClass[]>;
  joinLiveClass(liveClassId: string, userId: string): Promise<ILiveClass>;
  leaveLiveClass(liveClassId: string, userId: string): Promise<ILiveClass>;
  startLiveClass(liveClassId: string, teacherId: string): Promise<ILiveClass>;
  getTeacherId(liveClassId: string): Promise<string | null>;
}