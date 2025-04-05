import { Problem } from '../types/codeRunner.types';

export interface ICodeRunnerRepository {
  createProblem(problem: Omit<Problem, '_id' | 'createdAt' | 'updatedAt'>): Promise<Problem>;
  getProblems(): Promise<Problem[]>;
  getProblemById(id: string): Promise<Problem | null>;
  updateProblem(id: string, problem: Partial<Problem>): Promise<Problem | null>;
  deleteProblem(id: string): Promise<boolean>;
} 