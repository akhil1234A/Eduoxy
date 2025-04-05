'use client';

import React, { useState } from 'react';
import { Problem } from '@/types';
import { CodeEditor } from '@/components/code-runner/CodeEditor';
import { Box, Typography, Card, CardContent, Grid, Paper } from '@mui/material';
import { useGetProblemsQuery } from '@/state/api/codeRunnerApi';

export default function CodeRunnerPage() {
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const { data: problems = [], isLoading } = useGetProblemsQuery();

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 'calc(100vh - 100px)', overflow: 'auto' }}>
            <Typography variant="h5" sx={{ mb: 2 }}>Problems</Typography>
            {problems.map((problem) => (
              <Card
                key={problem._id}
                sx={{
                  mb: 2,
                  cursor: 'pointer',
                  bgcolor: selectedProblem?._id === problem._id ? 'primary.light' : 'background.paper',
                }}
                onClick={() => setSelectedProblem(problem)}
              >
                <CardContent>
                  <Typography variant="h6">{problem.title}</Typography>
                  <Typography color="textSecondary">{problem.difficulty}</Typography>
                  <Typography color="textSecondary">{problem.category}</Typography>
                </CardContent>
              </Card>
            ))}
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: 'calc(100vh - 100px)', overflow: 'auto' }}>
            {selectedProblem ? (
              <>
                <Typography variant="h4" sx={{ mb: 2 }}>{selectedProblem.title}</Typography>
                <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 2 }}>
                  Difficulty: {selectedProblem.difficulty} | Category: {selectedProblem.category}
                </Typography>
                <Typography variant="body1" sx={{ mb: 4, whiteSpace: 'pre-wrap' }}>
                  {selectedProblem.description}
                </Typography>
                <CodeEditor problem={selectedProblem} />
              </>
            ) : (
              <Typography>Select a problem to start coding</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 