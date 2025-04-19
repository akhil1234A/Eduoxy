import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { IRoadmapService } from "../interfaces/roadmap.service";
import TYPES from "../di/types";
import { successResponse, errorResponse } from "../types/types";
import { HttpStatus } from "../utils/httpStatus";
import { RESPONSE_MESSAGES } from "../utils/responseMessages";

@injectable()
export class RoadmapController {
  constructor(@inject(TYPES.IRoadmapService) private _roadmapService: IRoadmapService) {}

  async createRoadmap(req: Request, res: Response): Promise<void> {
    try {
      const roadmap = await this._roadmapService.createRoadmap(req.body);
      res.status(HttpStatus.CREATED).json(successResponse(RESPONSE_MESSAGES.ROADMAP.CREATE_SUCCESS, roadmap));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.ROADMAP.CREATE_FAIL, err.message));
    }
  }

  async getRoadmapById(req: Request, res: Response): Promise<void> {
    try {
      const roadmap = await this._roadmapService.getRoadmapById(req.params.id);
      if (!roadmap) {
        res.status(HttpStatus.NOT_FOUND).json(errorResponse(RESPONSE_MESSAGES.ROADMAP.NOT_FOUND));
        return;
      }
      res.json(successResponse(RESPONSE_MESSAGES.ROADMAP.FETCH_SUCCESS, roadmap));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.ROADMAP.FETCH_FAIL, err.message));
    }
  }

  async getAllRoadmaps(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const searchTerm = (req.query.searchTerm as string) || "";

      const result = await this._roadmapService.getAllRoadmaps(page, limit, searchTerm);
      res.json(successResponse(RESPONSE_MESSAGES.ROADMAP.FETCH_ALL_SUCCESS, result));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.ROADMAP.FETCH_FAIL, err.message));
    }
  }

  async updateRoadmap(req: Request, res: Response): Promise<void> {
    try {
      const roadmap = await this._roadmapService.updateRoadmap(req.params.id, req.body);
      if (!roadmap) {
        res.status(HttpStatus.NOT_FOUND).json(errorResponse(RESPONSE_MESSAGES.ROADMAP.NOT_FOUND));
        return;
      }
      res.json(successResponse(RESPONSE_MESSAGES.ROADMAP.UPDATE_SUCCESS, roadmap));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.ROADMAP.UPDATE_FAIL, err.message));
    }
  }

  async deleteRoadmap(req: Request, res: Response): Promise<void> {
    try {
      const success = await this._roadmapService.deleteRoadmap(req.params.id);
      if (!success) {
        res.status(HttpStatus.NOT_FOUND).json(errorResponse(RESPONSE_MESSAGES.ROADMAP.NOT_FOUND));
        return;
      }
      res.json(successResponse(RESPONSE_MESSAGES.ROADMAP.DELETE_SUCCESS));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.ROADMAP.DELETE_FAIL, err.message));
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
        res.status(HttpStatus.NOT_FOUND).json(errorResponse(RESPONSE_MESSAGES.ROADMAP.TOPIC_NOT_FOUND));
        return;
      }
      
      res.json(successResponse(RESPONSE_MESSAGES.ROADMAP.TOPIC_UPDATE_SUCCESS, roadmap));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.ROADMAP.TOPIC_UPDATE_FAIL, err.message));
    }
  }
} 