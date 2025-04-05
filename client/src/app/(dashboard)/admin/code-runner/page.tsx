'use client';

import React, { useState } from 'react';
import { ProblemForm } from '@/components/code-runner/ProblemForm';
import { Button, Dialog, DialogTitle, DialogContent, Box, Typography, Card, CardContent, CardActions } from '@mui/material';
import {
  useCreateProblemMutation,
  useUpdateProblemMutation,
  useDeleteProblemMutation,
  useGetProblemsQuery,
} from '@/state/api/codeRunnerApi';
import { Problem } from '@/types';

export default function CodeRunnerAdminPage() {
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  // Redux hooks
  const { data: problems = [], isLoading, refetch } = useGetProblemsQuery();
  const [createProblem] = useCreateProblemMutation();
  const [updateProblem] = useUpdateProblemMutation();
  const [deleteProblem] = useDeleteProblemMutation();

  const handleCreateProblem = async (problem: Omit<Problem, '_id'>) => {
    try {
      await createProblem(problem).unwrap();
      setOpenDialog(false);
      refetch();
    } catch (error) {
      console.error('Failed to create problem:', error);
    }
  };

  const handleUpdateProblem = async (problem: Omit<Problem, '_id'>) => {
    if (!selectedProblem?._id) return;
    try {
      await updateProblem({ id: selectedProblem._id, problem }).unwrap();
      setOpenDialog(false);
      setSelectedProblem(null);
      refetch();
    } catch (error) {
      console.error('Failed to update problem:', error);
    }
  };

  const handleDeleteProblem = async (id: string) => {
    try {
      await deleteProblem(id).unwrap();
      refetch();
    } catch (error) {
      console.error('Failed to delete problem:', error);
    }
  };

  const handleEditProblem = (problem: Problem) => {
    setSelectedProblem(problem);
    setOpenDialog(true);
  };

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Code Runner Problems</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            setSelectedProblem(null);
            setOpenDialog(true);
          }}
        >
          Create New Problem
        </Button>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
        {problems.map((problem) => (
          <Card key={problem._id}>
            <CardContent>
              <Typography variant="h6">{problem.title}</Typography>
              <Typography color="textSecondary">{problem.difficulty}</Typography>
              <Typography color="textSecondary">{problem.category}</Typography>
            </CardContent>
            <CardActions>
              <Button size="small" onClick={() => handleEditProblem(problem)}>
                Edit
              </Button>
              <Button size="small" color="error" onClick={() => handleDeleteProblem(problem._id!)}>
                Delete
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedProblem ? 'Edit Problem' : 'Create New Problem'}</DialogTitle>
        <DialogContent>
          <ProblemForm
            initialData={selectedProblem || undefined}
            onSubmit={selectedProblem ? handleUpdateProblem : handleCreateProblem}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
} 