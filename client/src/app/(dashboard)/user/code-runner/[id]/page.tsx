'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useGetProblemByIdQuery } from '@/state/api/codeRunnerApi';
import { CodeEditor } from '@/components/code-runner/CodeEditor';
import { Problem } from '@/types';

interface ProblemPageProps {
  params: {
    id: string;
  };
}



export default function ProblemPage({ params }: ProblemPageProps) {
  const router = useRouter();
  const { data: response, isLoading } = useGetProblemByIdQuery(params.id);
  const problem = response?.data;


  if (!problem) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Problem not found</h1>
          <Button
            onClick={() => router.push('/user/code-runner')}
            className="mt-4"
          >
            Back to Problems
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-white hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-white">{problem.title}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-[#25262F] border-[#3d3d3d]">
          <CardHeader>
            <CardTitle className="text-white">Problem Description</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  problem.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                  problem.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {problem.difficulty}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {problem.category}
                </span>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {problem.description}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#25262F] border-[#3d3d3d]">
          <CardHeader>
            <CardTitle className="text-white">Code Editor</CardTitle>
          </CardHeader>
          <CardContent>
            <CodeEditor problem={problem} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 