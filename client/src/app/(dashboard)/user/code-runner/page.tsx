'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Problem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useGetProblemsQuery } from '@/state/api/codeRunnerApi';



export default function ProblemsListPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: response, isLoading } = useGetProblemsQuery();
  const problems = response?.data || [];

  const filteredProblems = problems.filter((problem: Problem) =>
    problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    problem.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    problem.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <h1 className="text-2xl font-bold text-white">Coding Problems</h1>
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
            <Card 
              key={problem._id} 
              className="bg-[#25262F] border-[#3d3d3d] hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => router.push(`/user/code-runner/${problem._id}`)}
            >
              <CardHeader>
                <CardTitle className="text-white">{problem.title}</CardTitle>
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