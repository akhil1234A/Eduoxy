import { Request, Response } from 'express';
import { Problem, CodeExecutionRequest, CodeSubmissionRequest } from '../types/codeRunner.types';

export interface ICodeRunnerController {
  createProblem(req: Request, res: Response): Promise<void>;
  getProblems(req: Request, res: Response): Promise<void>;
  getProblemById(req: Request, res: Response): Promise<void>;
  updateProblem(req: Request, res: Response): Promise<void>;
  deleteProblem(req: Request, res: Response): Promise<void>;
  executeCode(req: Request, res: Response): Promise<void>;
  submitSolution(req: Request, res: Response): Promise<void>;
} 