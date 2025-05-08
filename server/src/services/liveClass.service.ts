import { injectable, inject } from "inversify";
import TYPES from "../di/types";
import { ILiveClassService } from "../interfaces/liveClass.service";
import { ILiveClassRepository } from "../interfaces/liveClass.repository";
import { ILiveClass } from "../models/liveClass.model";
import { SERVICE_MESSAGES } from "../utils/serviceMessages";

/**
 * This is a service responsible for managing live class functionalities
 * It handles creating, joining, leaving, starting, and deleting live classes
 */
@injectable()
export class LiveClassService implements ILiveClassService {
  constructor(
    @inject(TYPES.ILiveClassRepository) private liveClassRepository: ILiveClassRepository
  ) {}

  /**
   * This method creates a new live class
   * @param courseId 
   * @param teacherId 
   * @param title 
   * @param startTime 
   * @param endTime 
   * @returns liveClass
   */
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

  /**
   * This method retrieves a list of live classes for a specific course
   * @param courseId 
   * @returns list of live classes
   */
  async getSchedule(courseId: string): Promise<ILiveClass[]> {
    return await this.liveClassRepository.findByCourseId(courseId);
  }

  /**
   * This method retrieves a specific live class by its ID
   * @param liveClassId 
   * @returns live class
   */
  async joinLiveClass(liveClassId: string, userId: string): Promise<ILiveClass> {
    const liveClass = await this.liveClassRepository.findById(liveClassId);
    if (!liveClass) throw new Error(SERVICE_MESSAGES.LIVE_CLASS_NOT_FOUND);
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

  /**
   * This method allows a user to leave a live class
   * @param liveClassId 
   * @param userId 
   * @returns 
   */
  async leaveLiveClass(liveClassId: string, userId: string): Promise<ILiveClass> {
    const liveClass = await this.liveClassRepository.findById(liveClassId);
    if (!liveClass) throw new Error(SERVICE_MESSAGES.LIVE_CLASS_NOT_FOUND);
    const updatedClass = await this.liveClassRepository.removeParticipant(liveClassId, userId);
    if (!updatedClass) throw new Error("Failed to leave live class");
    return updatedClass;
  }

  /**
   * This method allows a teacher to start a live class
   * @param liveClassId 
   * @param teacherId 
   * @returns 
   */
  async startLiveClass(liveClassId: string, teacherId: string): Promise<ILiveClass> {
    const liveClass = await this.liveClassRepository.findById(liveClassId);
    if (!liveClass) throw new Error(SERVICE_MESSAGES.LIVE_CLASS_NOT_FOUND);
    if (liveClass.teacherId !== teacherId) throw new Error("Only the teacher can start the class");
    if (liveClass.isActive) throw new Error("Class is already active");

    const now = new Date().toISOString();
    if (now < liveClass.startTime) throw new Error("Class cannot start before scheduled time");

    const updatedClass = await this.liveClassRepository.update(liveClassId, { isActive: true });
    if (!updatedClass) throw new Error("Failed to start live class");
    return updatedClass;
  }

  /**
   * This method retrieves the teacher ID for a specific live class
   * @param liveClassId 
   * @returns 
   */
  async getTeacherId(liveClassId: string): Promise<string | null> {
    const liveClass = await this.liveClassRepository.findById(liveClassId);
    return liveClass?.teacherId || null;
  }

  /**
   * This method allows a teacher to delete a live class
   * @param liveClassId 
   * @returns 
   */
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