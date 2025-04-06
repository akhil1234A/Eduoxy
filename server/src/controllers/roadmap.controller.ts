import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { IRoadmapService } from "../interfaces/roadmap.service";
import TYPES from "../di/types";
import { successResponse, errorResponse } from "../types/types";
import { HttpStatus } from "../utils/httpStatus";

@injectable()
export class RoadmapController {
  constructor(@inject(TYPES.IRoadmapService) private _roadmapService: IRoadmapService) {}

  async createRoadmap(req: Request, res: Response): Promise<void> {
    try {
      const roadmap = await this._roadmapService.createRoadmap(req.body);
      res.status(HttpStatus.CREATED).json(successResponse("Roadmap created successfully", roadmap));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Failed to create roadmap", err.message));
    }
  }

  async getRoadmapById(req: Request, res: Response): Promise<void> {
    try {
      const roadmap = await this._roadmapService.getRoadmapById(req.params.id);
      if (!roadmap) {
        res.status(HttpStatus.NOT_FOUND).json(errorResponse("Roadmap not found"));
        return;
      }
      res.json(successResponse("Roadmap retrieved successfully", roadmap));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Failed to get roadmap", err.message));
    }
  }

  async getAllRoadmaps(req: Request, res: Response): Promise<void> {
    try {
      const roadmaps = await this._roadmapService.getAllRoadmaps();
      res.json(successResponse("Roadmaps retrieved successfully", roadmaps));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Failed to get roadmaps", err.message));
    }
  }

  async updateRoadmap(req: Request, res: Response): Promise<void> {
    try {
      const roadmap = await this._roadmapService.updateRoadmap(req.params.id, req.body);
      if (!roadmap) {
        res.status(HttpStatus.NOT_FOUND).json(errorResponse("Roadmap not found"));
        return;
      }
      res.json(successResponse("Roadmap updated successfully", roadmap));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Failed to update roadmap", err.message));
    }
  }

  async deleteRoadmap(req: Request, res: Response): Promise<void> {
    try {
      const success = await this._roadmapService.deleteRoadmap(req.params.id);
      if (!success) {
        res.status(HttpStatus.NOT_FOUND).json(errorResponse("Roadmap not found"));
        return;
      }
      res.json(successResponse("Roadmap deleted successfully"));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Failed to delete roadmap", err.message));
    }
  }

  async updateTopicProgress(req: Request, res: Response): Promise<void> {
    try {
      const { roadmapId, sectionId, topicId } = req.params;
      const { isCompleted } = req.body;
      
      const roadmap = await this._roadmapService.updateTopicProgress(
        roadmapId,
        sectionId,
        topicId,
        isCompleted
      );
      
      if (!roadmap) {
        res.status(HttpStatus.NOT_FOUND).json(errorResponse("Roadmap, section, or topic not found"));
        return;
      }
      
      res.json(successResponse("Topic progress updated successfully", roadmap));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Failed to update topic progress", err.message));
    }
  }
} 