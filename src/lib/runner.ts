import { TestCase, RunResult, TestResult } from '@/types';

const TIMEOUT_MS = 3000;

export interface RunnerInput {
  code: string;
  functionName: string;
  testCases: TestCase[];
  hiddenTestCases?: TestCase[];
  isSubmit?: boolean;
}

export function runCode(input: RunnerInput): Promise<RunResult> {
  return new Promise((resolve) => {
    const { code, functionName, testCases, hiddenTestCases, isSubmit } = input;

    // Combine test cases for submit, only visible for run
    const allTestCases = isSubmit
      ? [
          ...testCases.map(tc => ({ ...tc, isHidden: false })),
          ...(hiddenTestCases || []).map(tc => ({ ...tc, isHidden: true })),
        ]
      : testCases.map(tc => ({ ...tc, isHidden: false }));

    const worker = new Worker('/worker.js');

    // Set timeout to handle infinite loops
    const timeoutId = setTimeout(() => {
      worker.terminate();
      resolve({
        success: false,
        results: [],
        error: 'Time Limit Exceeded (3s). Your code took too long to execute. Check for infinite loops.',
        totalPassed: 0,
        totalTests: allTestCases.length,
      });
    }, TIMEOUT_MS);

    worker.onmessage = (e) => {
      clearTimeout(timeoutId);
      worker.terminate();

      const data = e.data as RunResult;
      resolve(data);
    };

    worker.onerror = (error) => {
      clearTimeout(timeoutId);
      worker.terminate();
      resolve({
        success: false,
        results: [],
        error: `Worker Error: ${error.message}`,
        totalPassed: 0,
        totalTests: allTestCases.length,
      });
    };

    worker.postMessage({
      code,
      testCases: allTestCases,
      functionName,
    });
  });
}
