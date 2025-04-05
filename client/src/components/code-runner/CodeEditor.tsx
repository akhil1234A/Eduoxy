import React, { useState } from 'react';
import { Problem, CodeExecutionRequest, CodeSubmissionRequest, ExecutionResult, SubmissionResult } from '@/types';
import { Button, Box, Typography, Paper, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import Editor from '@monaco-editor/react';
import { useExecuteCodeMutation, useSubmitSolutionMutation } from '@/state/api/codeRunnerApi';

interface CodeEditorProps {
  problem: Problem;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ problem }) => {
  const [code, setCode] = useState(problem.starterCode);
  const [language, setLanguage] = useState('javascript');
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [selectedTestCase, setSelectedTestCase] = useState(0);

  // Redux hooks
  const [executeCode] = useExecuteCodeMutation();
  const [submitSolution] = useSubmitSolutionMutation();

  const handleExecuteCode = async () => {
    try {
      const request: CodeExecutionRequest = {
        code,
        language,
        testCase: problem.testCases[selectedTestCase].input,
      };
      const result = await executeCode(request).unwrap();
      setExecutionResult(result);
    } catch (error) {
      console.error('Failed to execute code:', error);
    }
  };

  const handleSubmitSolution = async () => {
    try {
      const request: CodeSubmissionRequest = {
        problemId: problem._id!,
        code,
        language,
      };
      const result = await submitSolution(request).unwrap();
      setSubmissionResult(result);
    } catch (error) {
      console.error('Failed to submit solution:', error);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Language</InputLabel>
          <Select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            label="Language"
          >
            <MenuItem value="javascript">JavaScript</MenuItem>
            <MenuItem value="python">Python</MenuItem>
            <MenuItem value="java">Java</MenuItem>
            <MenuItem value="cpp">C++</MenuItem>
          </Select>
        </FormControl>
        <Box>
          <Button variant="contained" onClick={handleExecuteCode} sx={{ mr: 1 }}>
            Run Code
          </Button>
          <Button variant="contained" color="primary" onClick={handleSubmitSolution}>
            Submit Solution
          </Button>
        </Box>
      </Box>

      <Editor
        height="400px"
        defaultLanguage={language}
        value={code}
        onChange={(value) => setCode(value || '')}
        theme="vs-dark"
      />

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="h6">Test Cases</Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            {problem.testCases.map((_, index) => (
              <Button
                key={index}
                variant={selectedTestCase === index ? 'contained' : 'outlined'}
                onClick={() => setSelectedTestCase(index)}
              >
                Test Case {index + 1}
              </Button>
            ))}
          </Box>
          <Typography variant="subtitle1">Input:</Typography>
          <Typography sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
            {problem.testCases[selectedTestCase].input}
          </Typography>
          <Typography variant="subtitle1" sx={{ mt: 1 }}>Expected Output:</Typography>
          <Typography sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
            {problem.testCases[selectedTestCase].expectedOutput}
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="h6">Results</Typography>
          {executionResult && (
            <>
              <Typography variant="subtitle1">Output:</Typography>
              <Typography sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                {executionResult.stdout || executionResult.stderr || 'No output'}
              </Typography>
            </>
          )}
          {submissionResult && (
            <>
              <Typography variant="subtitle1" sx={{ mt: 1 }}>Submission Results:</Typography>
              <Typography color={submissionResult.passedAll ? 'success.main' : 'error.main'}>
                {submissionResult.passedAll ? 'All tests passed!' : 'Some tests failed'}
              </Typography>
              {submissionResult.results.map((result, index) => (
                <Box key={index} sx={{ mt: 1 }}>
                  <Typography>Test Case {index + 1}: {result.passed ? '✓' : '✗'}</Typography>
                  {!result.passed && (
                    <Typography sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                      {result.result.stdout || result.result.stderr || 'No output'}
                    </Typography>
                  )}
                </Box>
              ))}
            </>
          )}
        </Paper>
      </Box>
    </Box>
  );
}; 