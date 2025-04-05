import React, { useState } from 'react';
import { Problem, TestCase } from '@/types';
import { Button, TextField, Select, MenuItem, FormControl, InputLabel, Box, Typography } from '@mui/material';

interface ProblemFormProps {
  initialData?: Problem;
  onSubmit: (problem: Omit<Problem, '_id'>) => void;
}

export const ProblemForm: React.FC<ProblemFormProps> = ({ initialData, onSubmit }) => {
  const [problem, setProblem] = useState<Omit<Problem, '_id'>>(
    initialData || {
      title: '',
      description: '',
      difficulty: 'easy',
      testCases: [{ input: '', expectedOutput: '', explanation: '' }],
      starterCode: '',
      solution: '',
      category: '',
    }
  );

  const handleChange = (field: keyof Problem, value: any) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(problem);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Title"
          value={problem.title}
          onChange={(e) => handleChange('title', e.target.value)}
          required
        />
        
        <TextField
          label="Description"
          value={problem.description}
          onChange={(e) => handleChange('description', e.target.value)}
          multiline
          rows={4}
          required
        />
        
        <FormControl>
          <InputLabel>Difficulty</InputLabel>
          <Select
            value={problem.difficulty}
            onChange={(e) => handleChange('difficulty', e.target.value)}
            required
          >
            <MenuItem value="easy">Easy</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="hard">Hard</MenuItem>
          </Select>
        </FormControl>
        
        <TextField
          label="Category"
          value={problem.category}
          onChange={(e) => handleChange('category', e.target.value)}
          required
        />
        
        <TextField
          label="Starter Code"
          value={problem.starterCode}
          onChange={(e) => handleChange('starterCode', e.target.value)}
          multiline
          rows={6}
          required
        />
        
        <TextField
          label="Solution"
          value={problem.solution}
          onChange={(e) => handleChange('solution', e.target.value)}
          multiline
          rows={6}
          required
        />
        
        <Typography variant="h6">Test Cases</Typography>
        {problem.testCases.map((testCase, index) => (
          <Box key={index} sx={{ border: '1px solid #ccc', p: 2, borderRadius: 1 }}>
            <TextField
              label="Input"
              value={testCase.input}
              onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Expected Output"
              value={testCase.expectedOutput}
              onChange={(e) => handleTestCaseChange(index, 'expectedOutput', e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Explanation"
              value={testCase.explanation}
              onChange={(e) => handleTestCaseChange(index, 'explanation', e.target.value)}
              fullWidth
            />
            <Button onClick={() => removeTestCase(index)} color="error">
              Remove Test Case
            </Button>
          </Box>
        ))}
        
        <Button onClick={addTestCase} variant="outlined">
          Add Test Case
        </Button>
        
        <Button type="submit" variant="contained" color="primary">
          {initialData ? 'Update Problem' : 'Create Problem'}
        </Button>
      </Box>
    </form>
  );
}; 