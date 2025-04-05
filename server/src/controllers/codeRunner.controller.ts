import { Request, Response } from 'express';
import { ICodeRunnerController } from '../interfaces/codeRunner.controller.interface';
import { ICodeRunnerService } from '../interfaces/codeRunner.service.interface';
import { Problem, CodeExecutionRequest, CodeSubmissionRequest } from '../types/codeRunner.types';
import { injectable, inject } from 'inversify';
import TYPES from '../di/types';
import { HttpStatus } from '../utils/httpStatus';
import { errorResponse, successResponse } from '../types/types';
import { apiLogger } from '../utils/logger';


@injectable()
export class CodeRunnerController implements ICodeRunnerController {
  constructor(@inject(TYPES.ICodeRunnerService) private service: ICodeRunnerService) {}

  async createProblem(req: Request, res: Response): Promise<void> {
    try {
      const problem = await this.service.createProblem(req.body);
      res.status(HttpStatus.CREATED).json(successResponse("Problem created successfully", problem));
      apiLogger.info("Problem created successfully", {});
    } catch (error) {
      const err = error as Error
      res.status(HttpStatus.BAD_REQUEST).json(errorResponse("Failed to create problem", err.message));
      apiLogger.error("Failed to create problem", { error: err.message });
    }
  }

  async getProblems(req: Request, res: Response): Promise<void> {
    try {
      const problems = await this.service.getProblems();
      res.status(HttpStatus.OK).json(successResponse("Problems fetched successfully", problems));
      apiLogger.info("Problems fetched successfully", {});
    } catch (error) {
      const err = error as Error
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Failed to fetch problems", err.message));
      apiLogger.error("Failed to fetch problems", { error: err.message });
    }
  }

  async getProblemById(req: Request, res: Response): Promise<void> {
    try {
      const problem = await this.service.getProblemById(req.params.id);
      res.status(HttpStatus.OK).json(successResponse("Problem fetched successfully", problem));
      apiLogger.info("Problem fetched successfully", {});
    } catch (error) {
      const err = error as Error
      res.status(HttpStatus.NOT_FOUND).json(errorResponse("Problem not found", err.message));
      apiLogger.error("Problem not found", { error: err.message });
    }
  }

  async updateProblem(req: Request, res: Response): Promise<void> {
    try {
      const problem = await this.service.updateProblem(req.params.id, req.body);
      res.status(HttpStatus.OK).json(successResponse("Problem updated successfully", problem));
      apiLogger.info("Problem updated successfully", {});
    } catch (error) {
      const err = error as Error
      res.status(HttpStatus.NOT_FOUND).json(errorResponse("Problem not found", err.message));
      apiLogger.error("Problem not found", { error: err.message });
    }
  }

  async deleteProblem(req: Request, res: Response): Promise<void> {
    try {
      const success = await this.service.deleteProblem(req.params.id);
      if (success) {
        res.status(HttpStatus.OK).json(successResponse("Problem deleted successfully"));
        apiLogger.info("Problem deleted successfully", {});
      } else {
        res.status(HttpStatus.NOT_FOUND).json(errorResponse("Problem not found"));
        apiLogger.error("Problem not found", {});
      }
    } catch (error) {
      const err = error as Error
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Failed to delete problem", err.message));
      apiLogger.error("Failed to delete problem", { error: err.message });
    }
  }

  async executeCode(req: Request, res: Response): Promise<void> {
    try {
      const request: CodeExecutionRequest = req.body;
      const result = await this.service.executeCode(request);
      res.status(HttpStatus.OK).json(successResponse("Code executed successfully", result));
      apiLogger.info("Code executed successfully", {});
    } catch (error) {
      const err = error as Error
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Failed to execute code", err.message));
      apiLogger.error("Failed to execute code", { error: err.message });
    }
  }

  async submitSolution(req: Request, res: Response): Promise<void> {
    try {
      const request: CodeSubmissionRequest = req.body;
      const result = await this.service.submitSolution(request);
      res.status(HttpStatus.OK).json(successResponse("Solution submitted successfully", result));
      apiLogger.info("Solution submitted successfully", {});
    } catch (error) {
      const err = error as Error
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Failed to submit solution", err.message));
      apiLogger.error("Failed to submit solution", { error: err.message });
    }
  }
} 