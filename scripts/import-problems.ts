import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';

interface ProblemSchema {
  id: string;
  number: number;
  title: string;
  slug: string;
  description: string;
  topic: string;
  difficulty: string;
  starterCode: string;
  functionName: string;
  testCases: Array<{ input: unknown[]; expected: unknown }>;
  hiddenTestCases: Array<{ input: unknown[]; expected: unknown }>;
}

async function importProblems() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY not set. Add it to .env.local');
    process.exit(1);
  }

  const rawDir = path.join(process.cwd(), 'data', 'raw');
  if (!fs.existsSync(rawDir)) {
    console.log('📁 Creating data/raw directory...');
    fs.mkdirSync(rawDir, { recursive: true });
    console.log('ℹ️  Place your raw problem files (.md or .txt) in data/raw/');
    console.log('   Then run this script again.');
    process.exit(0);
  }

  const files = fs.readdirSync(rawDir).filter(f => f.endsWith('.md') || f.endsWith('.txt'));
  if (files.length === 0) {
    console.log('ℹ️  No .md or .txt files found in data/raw/');
    console.log('   Place your raw problem descriptions there and run again.');
    process.exit(0);
  }

  console.log(`📄 Found ${files.length} raw problem files`);

  const anthropic = new Anthropic({ apiKey });
  const results: ProblemSchema[] = [];

  for (const file of files) {
    const filePath = path.join(rawDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    console.log(`\n🔄 Processing: ${file}`);

    try {
      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: `Convert this raw problem description into a structured JSON object for a coding practice platform.

The JSON must have these exact fields:
- id: a kebab-case unique identifier (e.g., "basic-001")
- number: integer problem number
- title: string
- slug: kebab-case URL slug
- description: markdown formatted problem description with examples and constraints
- topic: one of "Basic", "Loops", "Patterns", "Arrays"
- difficulty: one of "Easy", "Medium", "Hard"
- starterCode: JavaScript function stub with helpful comments
- functionName: the name of the function
- testCases: array of {input: [...args], expected: value} (4-5 visible test cases)
- hiddenTestCases: array of {input: [...args], expected: value} (2-3 hidden test cases)

IMPORTANT: Convert any prompt()/console-input based problems into function-based ones (function takes arguments, returns a value). Pattern problems should return the pattern as a string.

Raw problem:
---
${content}
---

Return ONLY the JSON object, no explanation or markdown fences.`,
          },
        ],
      });

      const text = message.content[0].type === 'text' ? message.content[0].text : '';
      const problem = JSON.parse(text);
      results.push(problem);
      console.log(`   ✅ ${problem.title}`);
    } catch (error) {
      console.error(`   ❌ Failed to process ${file}:`, error);
    }
  }

  // Write to review file
  const reviewPath = path.join(process.cwd(), 'data', 'review.json');
  fs.writeFileSync(reviewPath, JSON.stringify(results, null, 2));
  console.log(`\n✅ Wrote ${results.length} problems to data/review.json`);
  console.log('📝 Review the file manually, then copy approved problems to data/problems.json');
  console.log('   Then run: npm run seed');
}

importProblems();
