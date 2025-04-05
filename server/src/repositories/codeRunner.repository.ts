import { Problem } from '../types/codeRunner.types';
import { ICodeRunnerRepository } from '../interfaces/codeRunner.repository.interface';
import { injectable, inject } from 'inversify';
import TYPES from '../di/types';
import { Model } from 'mongoose';

@injectable()

export class CodeRunnerRepository implements ICodeRunnerRepository {
  constructor(@inject(TYPES.ProblemModel) private model: Model<Problem>) {}

  async createProblem(problem: Omit<Problem, '_id' | 'createdAt' | 'updatedAt'>): Promise<Problem> {
    const newProblem = new this.model(problem);
    return await newProblem.save();
  }

  async getProblems(): Promise<Problem[]> {
    return await this.model.find();
  }

  async getProblemById(id: string): Promise<Problem | null> {
    return await this.model.findById(id);
  }

  async updateProblem(id: string, problem: Partial<Problem>): Promise<Problem | null> {
    return await this.model.findByIdAndUpdate(
      id,
      { ...problem, updatedAt: new Date() },
      { new: true }
    );
  }

  async deleteProblem(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id);
    return !!result;
  }
} 