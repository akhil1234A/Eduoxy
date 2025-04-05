'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Problem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { useCreateProblemMutation } from '@/state/api/codeRunnerApi';
import { toast } from 'sonner';

interface TestCase {
  input: string;
  expectedOutput: string;
  explanation: string;
}

export default function CreateProblemPage() {
  const router = useRouter();
  const [createProblem] = useCreateProblemMutation();

  const [problem, setProblem] = useState<Omit<Problem, '_id'>>({
    title: '',
    description: '',
    difficulty: 'easy',
    testCases: [{ input: '', expectedOutput: '', explanation: '' }],
    starterCode: '',
    solution: '',
    category: '',
  });

  const handleChange = (field: keyof Omit<Problem, '_id'>, value: string) => {
    setProblem((prev) => ({ ...prev, [field]: value }));
  };

  const handleTestCaseChange = (index: number, field: keyof TestCase, value: string) => {
    const newTestCases = [...problem.testCases];
    newTestCases[index] = { ...newTestCases[index], [field]: value };
    handleChange('testCases', newTestCases);
  };

  const addTestCase = () => {
    handleChange('testCases', [...problem.testCases, { input: '', expectedOutput: '', explanation: '' }]);
  };

  const removeTestCase = (index: number) => {
    const newTestCases = problem.testCases.filter((_, i) => i !== index);
    handleChange('testCases', newTestCases);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProblem(problem).unwrap();
      toast.success('Problem created successfully');
      router.push('/admin/code-runner');
    } catch (error) {
      toast.error('Failed to create problem');
      console.error('Failed to create problem:', error);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-white hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-white">Create New Problem</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-[#25262F] border-[#3d3d3d]">
          <CardHeader>
            <CardTitle className="text-white">Problem Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-white">Title</Label>
              <Input
                id="title"
                value={problem.title}
                onChange={(e) => handleChange('title', e.target.value)}
                required
                className="bg-[#1B1C22] text-white border-[#3d3d3d]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-white">Description</Label>
              <Textarea
                id="description"
                value={problem.description}
                onChange={(e) => handleChange('description', e.target.value)}
                required
                className="bg-[#1B1C22] text-white border-[#3d3d3d] min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty" className="text-white">Difficulty</Label>
              <Select
                value={problem.difficulty}
                onValueChange={(value) => handleChange('difficulty', value)}
              >
                <SelectTrigger className="bg-[#1B1C22] text-white border-[#3d3d3d]">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent className="bg-[#1B1C22] text-white border-[#3d3d3d]">
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-white">Category</Label>
              <Input
                id="category"
                value={problem.category}
                onChange={(e) => handleChange('category', e.target.value)}
                required
                className="bg-[#1B1C22] text-white border-[#3d3d3d]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="starterCode" className="text-white">Starter Code</Label>
              <Textarea
                id="starterCode"
                value={problem.starterCode}
                onChange={(e) => handleChange('starterCode', e.target.value)}
                required
                className="bg-[#1B1C22] text-white border-[#3d3d3d] min-h-[150px] font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="solution" className="text-white">Solution</Label>
              <Textarea
                id="solution"
                value={problem.solution}
                onChange={(e) => handleChange('solution', e.target.value)}
                required
                className="bg-[#1B1C22] text-white border-[#3d3d3d] min-h-[150px] font-mono"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#25262F] border-[#3d3d3d]">
          <CardHeader>
            <CardTitle className="text-white">Test Cases</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {problem.testCases.map((testCase, index) => (
              <Card key={index} className="bg-[#1B1C22] border-[#3d3d3d] p-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`input-${index}`} className="text-white">Input</Label>
                    <Textarea
                      id={`input-${index}`}
                      value={testCase.input}
                      onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                      required
                      className="bg-[#25262F] text-white border-[#3d3d3d] min-h-[60px] font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`expectedOutput-${index}`} className="text-white">Expected Output</Label>
                    <Textarea
                      id={`expectedOutput-${index}`}
                      value={testCase.expectedOutput}
                      onChange={(e) => handleTestCaseChange(index, 'expectedOutput', e.target.value)}
                      required
                      className="bg-[#25262F] text-white border-[#3d3d3d] min-h-[60px] font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`explanation-${index}`} className="text-white">Explanation</Label>
                    <Textarea
                      id={`explanation-${index}`}
                      value={testCase.explanation}
                      onChange={(e) => handleTestCaseChange(index, 'explanation', e.target.value)}
                      className="bg-[#25262F] text-white border-[#3d3d3d] min-h-[60px]"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeTestCase(index)}
                    className="w-full"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove Test Case
                  </Button>
                </div>
              </Card>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addTestCase}
              className="w-full bg-[#25262F] text-white border-[#3d3d3d] hover:bg-[#1B1C22]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Test Case
            </Button>
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90"
        >
          Create Problem
        </Button>
      </form>
    </div>
  );
} 