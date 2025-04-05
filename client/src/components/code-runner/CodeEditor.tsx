'use client';

import React, { useState } from 'react';
import { Problem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useExecuteCodeMutation, useSubmitSolutionMutation } from '@/state/api/codeRunnerApi';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  problem: Problem;
}

interface ExecutionResult {
  stdout: string | null;
  stderr: string | null;
  time: string;
  memory: number;
  status: {
    id: number;
    description: string;
  };
}

interface SubmissionResult {
  results: Array<{
    testCase: {
      input: string;
      expectedOutput: string;
      explanation: string;
    };
    result: ExecutionResult;
    passed: boolean;
  }>;
  passedAll: boolean;
}

const SUPPORTED_LANGUAGES = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
];

export const CodeEditor: React.FC<CodeEditorProps> = ({ problem }) => {
  const [code, setCode] = useState(problem.starterCode);
  const [language, setLanguage] = useState('python');
  const [selectedTestCase, setSelectedTestCase] = useState(0);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [executeCode] = useExecuteCodeMutation();
  const [submitSolution] = useSubmitSolutionMutation();

  const handleExecuteCode = async () => {
    try {
      setIsExecuting(true);
      setExecutionResult(null);
      const response = await executeCode({
        code,
        language,
        testCase: problem.testCases[selectedTestCase].input,
      }).unwrap();
      setExecutionResult(response.data);
    } catch (error) {
      console.error('Failed to execute code:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSubmitSolution = async () => {
    try {
      setIsSubmitting(true);
      setSubmissionResult(null);
      const response = await submitSolution({
        problemId: problem._id!,
        code,
        language,
      }).unwrap();
      setSubmissionResult(response.data);
    } catch (error) {
      console.error('Failed to submit solution:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="h-[400px] border rounded-md">
        <Editor
          height="100%"
          defaultLanguage={language}
          value={code}
          onChange={(value) => setCode(value || '')}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: false,
          }}
        />
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleExecuteCode}
          disabled={isExecuting}
          className="bg-primary hover:bg-primary/90"
        >
          {isExecuting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          Run Code
        </Button>
        <Button
          onClick={handleSubmitSolution}
          disabled={isSubmitting}
          className="bg-green-600 hover:bg-green-700"
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="mr-2 h-4 w-4" />
          )}
          Submit Solution
        </Button>
      </div>

      <Tabs defaultValue="test-cases" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="test-cases">Test Cases</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>
        <TabsContent value="test-cases">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {problem.testCases.map((_, index) => (
                  <Button
                    key={index}
                    variant={selectedTestCase === index ? "default" : "outline"}
                    onClick={() => setSelectedTestCase(index)}
                    className="min-w-[100px]"
                  >
                    Test Case {index + 1}
                  </Button>
                ))}
              </div>
              <div className="space-y-2">
                <div>
                  <h4 className="text-sm font-medium">Input:</h4>
                  <pre className="bg-muted p-2 rounded-md text-sm">{problem.testCases[selectedTestCase].input}</pre>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Expected Output:</h4>
                  <pre className="bg-muted p-2 rounded-md text-sm">{problem.testCases[selectedTestCase].expectedOutput}</pre>
                </div>
                {problem.testCases[selectedTestCase].explanation && (
                  <div>
                    <h4 className="text-sm font-medium">Explanation:</h4>
                    <p className="text-sm text-muted-foreground">{problem.testCases[selectedTestCase].explanation}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="results">
          <Card>
            <CardContent className="p-4 space-y-4">
              {executionResult && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Execution Result:</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Status:</span>
                      <span className={`text-sm ${
                        executionResult.status.id === 3 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {executionResult.status.description}
                      </span>
                    </div>
                    {executionResult.stdout && (
                      <div>
                        <h4 className="text-sm font-medium">Output:</h4>
                        <pre className="bg-muted p-2 rounded-md text-sm">{executionResult.stdout}</pre>
                      </div>
                    )}
                    {executionResult.stderr && (
                      <div>
                        <h4 className="text-sm font-medium">Error:</h4>
                        <pre className="bg-red-100 p-2 rounded-md text-sm text-red-800">{executionResult.stderr}</pre>
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      <span className="text-sm">Time: {executionResult.time}s</span>
                      <span className="text-sm">Memory: {executionResult.memory}KB</span>
                    </div>
                  </div>
                </div>
              )}

              {submissionResult && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium">Submission Results:</h4>
                    {submissionResult.passedAll ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="space-y-4">
                    {submissionResult.results.map((result, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Test Case {index + 1}:</span>
                          {result.passed ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        {!result.passed && (
                          <div className="space-y-2">
                            <div>
                              <h4 className="text-sm font-medium">Your Output:</h4>
                              <pre className="bg-muted p-2 rounded-md text-sm">
                                {result.result.stdout || 'No output'}
                              </pre>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium">Expected Output:</h4>
                              <pre className="bg-muted p-2 rounded-md text-sm">
                                {result.testCase.expectedOutput}
                              </pre>
                            </div>
                            {result.testCase.explanation && (
                              <div>
                                <h4 className="text-sm font-medium">Explanation:</h4>
                                <p className="text-sm text-muted-foreground">
                                  {result.testCase.explanation}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 