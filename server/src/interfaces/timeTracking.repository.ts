import { IUserTimeTracking } from "../models/userTimeTracking.model";

export interface ITimeTrackingRepository {
 updateTimeSpent(userId: string, courseId:string, chapterId: string, timeSpentSeconds: number): Promise<IUserTimeTracking>;
 getTotalTimeSpent(userId: string, courseId?: string): Promise<number>;
}