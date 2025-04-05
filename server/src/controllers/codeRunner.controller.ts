import { Request, Response } from 'express';
import { ICodeRunnerController } from '../interfaces/codeRunner.controller.interface';
import { ICodeRunnerService } from '../interfaces/codeRunner.service.interface';
import { Problem, CodeExecutionRequest, CodeSubmissionRequest } from '../types/codeRunner.types';
import { injectable, inject } from 'inversify';
import TYPES from '../di/types';
import { HttpStatus } from '../utils/httpStatus';
import { errorResponse, successResponse } from '../types/types';

@injectable()
export class CodeRunnerController implements ICodeRunnerController {
  constructor(@inject(TYPES.ICodeRunnerService) private service: ICodeRunnerService) {}

  async createProblem(req: Request, res: Response): Promise<void> {
    try {
      const problem = await this.service.createProblem(req.body);
      res.status(HttpStatus.CREATED).json(successResponse("Problem created successfully", problem));
    } catch (error) {
      const err = error as Error
      res.status(HttpStatus.BAD_REQUEST).json(errorResponse("Failed to create problem", err.message));
    }
  }

  async getProblems(req: Request, res: Response): Promise<void> {
    try {
      const problems = await this.service.getProblems();
      res.status(HttpStatus.OK).json(successResponse("Problems fetched successfully", problems));
    } catch (error) {
      const err = error as Error
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Failed to fetch problems", err.message));
    }
  }

  async getProblemById(req: Request, res: Response): Promise<void> {
    try {
      const problem = await this.service.getProblemById(req.params.id);
      res.status(HttpStatus.OK).json(successResponse("Problem fetched successfully", problem));
    } catch (error) {
      const err = error as Error
      res.status(HttpStatus.NOT_FOUND).json(errorResponse("Problem not found", err.message));
    }
  }

  async updateProblem(req: Request, res: Response): Promise<void> {
    try {
      const problem = await this.service.updateProblem(req.params.id, req.body);
      res.status(HttpStatus.OK).json(successResponse("Problem updated successfully", problem));
    } catch (error) {
      const err = error as Error
      res.status(HttpStatus.NOT_FOUND).json(errorResponse("Problem not found", err.message));
    }
  }

  async deleteProblem(req: Request, res: Response): Promise<void> {
    try {
      const success = await this.service.deleteProblem(req.params.id);
      if (success) {
        res.status(HttpStatus.OK).json(successResponse("Problem deleted successfully"));
      } else {
        res.status(HttpStatus.NOT_FOUND).json(errorResponse("Problem not found"));
      }
    } catch (error) {
      const err = error as Error
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Failed to delete problem", err.message));
    }
  }

  async executeCode(req: Request, res: Response): Promise<void> {
    try {
      const request: CodeExecutionRequest = req.body;
      const result = await this.service.executeCode(request);
      res.status(HttpStatus.OK).json(successResponse("Code executed successfully", result));
    } catch (error) {
      const err = error as Error
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Failed to execute code", err.message));
    }
  }

  async submitSolution(req: Request, res: Response): Promise<void> {
    try {
      const request: CodeSubmissionRequest = req.body;
      const result = await this.service.submitSolution(request);
      res.status(HttpStatus.OK).json(successResponse("Solution submitted successfully", result));
    } catch (error) {
      const err = error as Error
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Failed to submit solution", err.message));
    }
  }
} 