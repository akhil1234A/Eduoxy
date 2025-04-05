import { Types } from 'mongoose';

export interface TestCase {
  input: string;
  expectedOutput: string;
  explanation?: string;
}

export interface Problem {
  _id?: Types.ObjectId;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  testCases: TestCase[];
  starterCode: string;
  solution: string;
  category: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CodeExecutionRequest {
  code: string;
  language: string;
  testCase: string;
}

export interface CodeSubmissionRequest {
  problemId: string;
  code: string;
  language: string;
}

export interface ExecutionResult {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  status: {
    id: number;
    description: string;
  };
}

export interface SubmissionResult {
  results: {
    testCase: TestCase;
    result: ExecutionResult;
    passed: boolean;
  }[];
  passedAll: boolean;
} 