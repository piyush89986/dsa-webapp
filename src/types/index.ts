export interface Problem {
  _id?: string;
  id: string;
  number: number;
  title: string;
  slug: string;
  description: string;
  topic: 'Basic' | 'Loops' | 'Patterns' | 'Arrays';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  starterCode: string;
  functionName: string;
  testCases: TestCase[];
  hiddenTestCases: TestCase[];
}

export interface TestCase {
  input: unknown[];
  expected: unknown;
}

export interface Submission {
  _id?: string;
  userId: string;
  problemId: string;
  code: string;
  result: 'accepted' | 'wrong_answer' | 'error' | 'timeout';
  passedTests: number;
  totalTests: number;
  timestamp: Date;
  runtime?: number;
}

export interface User {
  _id?: string;
  name: string;
  email: string;
  password?: string;
  image?: string;
  createdAt: Date;
  aiRequestCount: number;
  aiRequestDate: string; // YYYY-MM-DD
}

export interface TestResult {
  passed: boolean;
  input: unknown[];
  expected: unknown;
  actual: unknown;
  error?: string;
  runtime: number;
  consoleOutput: string[];
  isHidden?: boolean;
}

export interface RunResult {
  success: boolean;
  results: TestResult[];
  error?: string;
  totalPassed: number;
  totalTests: number;
}
