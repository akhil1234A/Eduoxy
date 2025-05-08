import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { IRoadmapService } from "../interfaces/roadmap.service";
import TYPES from "../di/types";
import { successResponse, errorResponse } from "../types/types";
import { HttpStatus } from "../utils/httpStatus";
import { RESPONSE_MESSAGES } from "../utils/responseMessages";
import { buildPaginationResult, getPaginationParams } from "../utils/paginationUtil";

/**
 * Controller for handling roadmap functionality
 * *    1. Create a roadmap
 * *    2. Get roadmap by ID
 * *    3. Get all roadmaps
 * *    4. Update a roadmap
 * *    5. Delete a roadmap
 * *    6. Update topic progress
 * 
 */
@injectable()
export class RoadmapController {
  constructor(@inject(TYPES.IRoadmapService) private _roadmapService: IRoadmapService) {}

  /**
   * This method handles the creation of a roadmap
   * @param req 
   * @param res 
   */
  async createRoadmap(req: Request, res: Response): Promise<void> {
    try {
      const roadmap = await this._roadmapService.createRoadmap(req.body);
      res.status(HttpStatus.CREATED).json(successResponse(RESPONSE_MESSAGES.ROADMAP.CREATE_SUCCESS, roadmap));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.ROADMAP.CREATE_FAIL, err.message));
    }
  }

  /**
   * This method retrieves a roadmap by its ID
   * @param req id
   * @param res 
   * @returns 
   */
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

  /**
   * This method get all roadmaps with pagination and search
   * @param req page, limit, searchTerm
   * @param res 
   */

  async getAllRoadmaps(req: Request, res: Response): Promise<void> {
    try {
      
      const params = getPaginationParams(req);

      const result = await this._roadmapService.getAllRoadmaps(params.page, params.limit, params.searchTerm);
      res.json(successResponse(RESPONSE_MESSAGES.ROADMAP.FETCH_ALL_SUCCESS, result));

    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.ROADMAP.FETCH_FAIL, err.message));
    }
  }

  /**
   * This method updates a roadmap by its ID
   * @param req id, body
   * @param res 
   */
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

  /**
   * This method deletes a roadmap by its ID
   * @param req id
   * @param res 
   */
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

  /**
   * This method updates the progress of a topic in a roadmap
   * @param req roadmapId, sectionId, topicId, isCompleted
   * @param res 
   */
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