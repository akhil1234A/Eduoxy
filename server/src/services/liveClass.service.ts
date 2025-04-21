import { injectable, inject } from "inversify";
import TYPES from "../di/types";
import { ILiveClassService } from "../interfaces/liveClass.service";
import { ILiveClassRepository } from "../interfaces/liveClass.repository";
import { ILiveClass } from "../models/liveClass.model";

@injectable()
export class LiveClassService implements ILiveClassService {
  constructor(
    @inject(TYPES.ILiveClassRepository) private liveClassRepository: ILiveClassRepository
  ) {}

  async createLiveClass(courseId: string, teacherId: string, title: string, startTime: string, endTime: string): Promise<ILiveClass> {
    const liveClassData = {
      courseId,
      teacherId,
      title,
      startTime,
      endTime,
      participants: [teacherId], 
      isActive: false,
    };
    return await this.liveClassRepository.create(liveClassData);
  }

  async getSchedule(courseId: string): Promise<ILiveClass[]> {
    return await this.liveClassRepository.findByCourseId(courseId);
  }

  async joinLiveClass(liveClassId: string, userId: string): Promise<ILiveClass> {
    const liveClass = await this.liveClassRepository.findById(liveClassId);
    if (!liveClass) throw new Error("Live class not found");
    if (!liveClass.isActive) throw new Error("Live class is not active yet");
    if (liveClass.participants.length >= 5) throw new Error("Class is full (max 5 participants)");

    const now = new Date().toISOString();
    if (now < liveClass.startTime || now > liveClass.endTime) {
      throw new Error("Live class is not within scheduled time");
    }

    const updatedClass = await this.liveClassRepository.addParticipant(liveClassId, userId);
    if (!updatedClass) throw new Error("Failed to join live class");
    return updatedClass;
  }

  async leaveLiveClass(liveClassId: string, userId: string): Promise<ILiveClass> {
    const liveClass = await this.liveClassRepository.findById(liveClassId);
    if (!liveClass) throw new Error("Live class not found");
    const updatedClass = await this.liveClassRepository.removeParticipant(liveClassId, userId);
    if (!updatedClass) throw new Error("Failed to leave live class");
    return updatedClass;
  }

  async startLiveClass(liveClassId: string, teacherId: string): Promise<ILiveClass> {
    const liveClass = await this.liveClassRepository.findById(liveClassId);
    if (!liveClass) throw new Error("Live class not found");
    if (liveClass.teacherId !== teacherId) throw new Error("Only the teacher can start the class");
    if (liveClass.isActive) throw new Error("Class is already active");

    const now = new Date().toISOString();
    if (now < liveClass.startTime) throw new Error("Class cannot start before scheduled time");

    const updatedClass = await this.liveClassRepository.update(liveClassId, { isActive: true });
    if (!updatedClass) throw new Error("Failed to start live class");
    return updatedClass;
  }

  async getTeacherId(liveClassId: string): Promise<string | null> {
    const liveClass = await this.liveClassRepository.findById(liveClassId);
    return liveClass?.teacherId || null;
  }

  async deleteLiveClass(liveClassId: string): Promise<boolean> {
    try {
      const result = await this.liveClassRepository.findByIdAndDelete(liveClassId);
      return !!result;
    } catch (error) {
      console.error('Error deleting live class:', error);
      return false;
    }
  }
}