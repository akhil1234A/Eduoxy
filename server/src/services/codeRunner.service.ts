import { ICodeRunnerService } from '../interfaces/codeRunner.service.interface';
import { ICodeRunnerRepository } from '../interfaces/codeRunner.repository.interface';
import { Problem, CodeExecutionRequest, CodeSubmissionRequest, ExecutionResult, SubmissionResult } from '../types/codeRunner.types';
import axios from 'axios';
import { injectable, inject } from 'inversify';
import TYPES from '../di/types';

@injectable()
export class CodeRunnerService implements ICodeRunnerService {
  constructor(@inject(TYPES.ICodeRunnerRepository) private repository: ICodeRunnerRepository) {}

  async createProblem(problem: Omit<Problem, '_id' | 'createdAt' | 'updatedAt'>): Promise<Problem> {
    return await this.repository.createProblem(problem);
  }

  async getProblems(): Promise<Problem[]> {
    return await this.repository.getProblems();
  }

  async getProblemById(id: string): Promise<Problem> {
    const problem = await this.repository.getProblemById(id);
    if (!problem) {
      throw new Error('Problem not found');
    }
    return problem;
  }

  async updateProblem(id: string, problem: Partial<Problem>): Promise<Problem> {
    const updatedProblem = await this.repository.updateProblem(id, problem);
    if (!updatedProblem) {
      throw new Error('Problem not found');
    }
    return updatedProblem;
  }

  async deleteProblem(id: string): Promise<boolean> {
    return await this.repository.deleteProblem(id);
  }

  private getLanguageId(language: string): number {
    const languageMap: { [key: string]: number } = {
      'python': 71,
      'javascript': 63,
      'java': 62,
      'cpp': 54,
      'c': 50,
    };
    return languageMap[language.toLowerCase()] || 71; // Default to Python
  }

  private async submitToJudge0(sourceCode: string, languageId: number, stdin: string): Promise<string> {
    const response = await axios.post(
      process.env.JUDGE0_API_URL || '',
      {
        source_code: sourceCode,
        language_id: languageId,
        stdin: stdin,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        },
      }
    );
    return response.data.token;
  }

  private async getJudge0Result(token: string): Promise<ExecutionResult> {
    const response = await axios.get(`${process.env.JUDGE0_API_URL}/${token}`, {
      headers: {
        'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
      },
    });
    return response.data;
  }

  async executeCode(request: CodeExecutionRequest): Promise<ExecutionResult> {
    const languageId = this.getLanguageId(request.language);
    const token = await this.submitToJudge0(request.code, languageId, request.testCase);
    
    // Wait for execution
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return await this.getJudge0Result(token);
  }

  async submitSolution(request: CodeSubmissionRequest): Promise<SubmissionResult> {
    const problem = await this.getProblemById(request.problemId);
    const languageId = this.getLanguageId(request.language);
    
    const results = [];
    for (const testCase of problem.testCases) {
      const token = await this.submitToJudge0(request.code, languageId, testCase.input);
      
      // Wait for execution
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const result = await this.getJudge0Result(token);
      
      results.push({
        testCase,
        result,
        passed: result.stdout?.trim() === testCase.expectedOutput.trim()
      });
    }

    return {
      results,
      passedAll: results.every(r => r.passed)
    };
  }
} 