// Web Worker for executing user code in a sandboxed environment
// This worker receives code and test cases, runs them, and returns results

self.onmessage = function (e) {
  const { code, testCases, functionName } = e.data;
  const results = [];

  for (const testCase of testCases) {
    const consoleOutput = [];
    const startTime = performance.now();

    try {
      // Override console.log to capture output
      const originalLog = console.log;
      console.log = (...args) => {
        consoleOutput.push(args.map(a => 
          typeof a === 'object' ? JSON.stringify(a) : String(a)
        ).join(' '));
      };

      // Create a function from user code and execute it
      // eslint-disable-next-line no-new-func
      const userFunction = new Function(code + `\nreturn ${functionName};`)();
      
      // Deep clone input to avoid mutation issues
      const inputClone = JSON.parse(JSON.stringify(testCase.input));
      const actual = userFunction(...inputClone);
      const endTime = performance.now();
      const runtime = Math.round((endTime - startTime) * 100) / 100;

      // Compare using JSON.stringify for deep equality
      const passed = JSON.stringify(actual) === JSON.stringify(testCase.expected);

      console.log = originalLog;

      results.push({
        passed,
        input: testCase.input,
        expected: testCase.expected,
        actual,
        runtime,
        consoleOutput,
        isHidden: testCase.isHidden || false,
      });
    } catch (error) {
      const endTime = performance.now();
      const runtime = Math.round((endTime - startTime) * 100) / 100;

      results.push({
        passed: false,
        input: testCase.input,
        expected: testCase.expected,
        actual: undefined,
        error: error.message,
        runtime,
        consoleOutput,
        isHidden: testCase.isHidden || false,
      });
    }
  }

  const totalPassed = results.filter(r => r.passed).length;

  self.postMessage({
    success: true,
    results,
    totalPassed,
    totalTests: results.length,
  });
};
