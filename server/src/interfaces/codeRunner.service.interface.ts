import { Problem, CodeExecutionRequest, CodeSubmissionRequest, ExecutionResult, SubmissionResult } from '../types/codeRunner.types';

export interface ICodeRunnerService {
  createProblem(problem: Omit<Problem, '_id' | 'createdAt' | 'updatedAt'>): Promise<Problem>;
  getProblems(): Promise<Problem[]>;
  getProblemById(id: string): Promise<Problem>;
  updateProblem(id: string, problem: Partial<Problem>): Promise<Problem>;
  deleteProblem(id: string): Promise<boolean>;
  executeCode(request: CodeExecutionRequest): Promise<ExecutionResult>;
  submitSolution(request: CodeSubmissionRequest): Promise<SubmissionResult>;
} 