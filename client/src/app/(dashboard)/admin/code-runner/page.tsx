'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  useGetProblemsQuery,
  useDeleteProblemMutation,
} from '@/state/api/codeRunnerApi';
import { Problem } from '@/types';
import { toast } from 'sonner';

export default function CodeRunnerAdminPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, refetch } = useGetProblemsQuery();
  const problems = data?.data || [];
  const [deleteProblem] = useDeleteProblemMutation();

  const filteredProblems = problems.filter((problem: Problem) =>
    problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    problem.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    problem.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteProblem = async (id: string) => {
    try {
      await deleteProblem(id).unwrap();
      refetch();
      toast.success('Problem deleted successfully');
    } catch (error) {
      toast.error('Failed to delete problem');
      console.error('Failed to delete problem:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Code Runner Problems</h1>
        <Button
          onClick={() => router.push('/admin/code-runner/new')}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create New Problem
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search problems..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 bg-[#25262F] text-white border-[#3d3d3d]"
        />
      </div>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProblems.map((problem: Problem) => (
            <Card key={problem._id} className="bg-[#25262F] border-[#3d3d3d]">
              <CardHeader>
                <CardTitle className="flex justify-between items-start text-white">
                  <span>{problem.title}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/admin/code-runner/${problem._id}`)}
                      className="text-white hover:text-primary"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteProblem(problem._id!)}
                      className="text-white hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
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
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {problem.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
} 