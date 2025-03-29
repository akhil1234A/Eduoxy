import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import TYPES from "../di/types";
import { ILiveClassService } from "../interfaces/liveClass.service";

@injectable()
export class LiveClassController {
  constructor(
    @inject(TYPES.ILiveClassService) private liveClassService: ILiveClassService
  ) {}

  async createLiveClass(req: Request, res: Response): Promise<void> {
    const { courseId, teacherId, title, startTime, endTime } = req.body;
    try {
      const liveClass = await this.liveClassService.createLiveClass(courseId, teacherId, title, startTime, endTime);
      res.status(201).json(liveClass);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  async getSchedule(req: Request, res: Response): Promise<void> {
    const { courseId } = req.params;
    try {
      const schedule = await this.liveClassService.getSchedule(courseId);
      res.json(schedule);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  async joinLiveClass(req: Request, res: Response): Promise<void> {
    const { liveClassId } = req.params;
    const { userId } = req.body; 
    try {
      const liveClass = await this.liveClassService.joinLiveClass(liveClassId, userId);
      res.json(liveClass);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  async leaveLiveClass(req: Request, res: Response): Promise<void> {
    const { liveClassId } = req.params;
    const { userId } = req.body;
    try {
      const liveClass = await this.liveClassService.leaveLiveClass(liveClassId, userId);
      res.json(liveClass);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  async startLiveClass(req: Request, res: Response): Promise<void> {
    const { liveClassId } = req.params;
    const { teacherId } = req.body;
    try {
      const liveClass = await this.liveClassService.startLiveClass(liveClassId, teacherId);
      res.json(liveClass);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }
}