import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from './baseQuery';
import { 
  Problem, 
  CodeExecutionRequest, 
  CodeSubmissionRequest, 
  ExecutionResult, 
  SubmissionResult 
} from '../../types';

export const codeRunnerApi = createApi({
  reducerPath: 'codeRunnerApi',
  baseQuery: customBaseQuery,
  tagTypes: ['CodeProblems', 'ExecutionResults'],
  endpoints: (build) => ({
    // Admin endpoints
    createProblem: build.mutation<Problem, Omit<Problem, '_id'>>({
      query: (problem) => ({
        url: '/code-runner',
        method: 'POST',
        body: problem,
      }),
      invalidatesTags: ['CodeProblems'],
    }),

    updateProblem: build.mutation<Problem, { id: string; problem: Partial<Problem> }>({
      query: ({ id, problem }) => ({
        url: `/code-runner/${id}`,
        method: 'PUT',
        body: problem,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'CodeProblems', id },
        'CodeProblems'
      ],
    }),

    deleteProblem: build.mutation<void, string>({
      query: (id) => ({
        url: `/code-runner/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['CodeProblems'],
    }),

    // Query endpoints
    getProblems: build.query<Problem[], void>({
      query: () => '/code-runner',
      providesTags: ['CodeProblems'],
    }),

    getProblemById: build.query<Problem, string>({
      query: (id) => `/code-runner/${id}`,
      providesTags: (result, error, id) => [{ type: 'CodeProblems', id }],
    }),

    // Execution endpoints
    executeCode: build.mutation<ExecutionResult, CodeExecutionRequest>({
      query: (request) => ({
        url: '/code-runner/execute',
        method: 'POST',
        body: request,
      }),
      invalidatesTags: ['ExecutionResults'],
    }),

    submitSolution: build.mutation<SubmissionResult, CodeSubmissionRequest>({
      query: (request) => ({
        url: '/code-runner/submit',
        method: 'POST',
        body: request,
      }),
      invalidatesTags: ['ExecutionResults'],
    }),
  }),
});

export const {
  useCreateProblemMutation,
  useUpdateProblemMutation,
  useDeleteProblemMutation,
  useGetProblemsQuery,
  useGetProblemByIdQuery,
  useExecuteCodeMutation,
  useSubmitSolutionMutation,
} = codeRunnerApi;