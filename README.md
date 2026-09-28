# DSA Practice — LeetCode-style Web App

A full-stack coding practice platform where users solve DSA problems in JavaScript, with an interactive Monaco editor, Web Worker-based code execution, and AI-powered features.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## Features

- **25 DSA Problems** across 4 categories: Basic, Loops, Patterns, Arrays
- **Monaco Editor** with syntax highlighting and IntelliSense
- **Web Worker** code execution with 3s timeout (handles infinite loops)
- **Split-panel layout** with resizable panes
- **AI-Powered** hints, code review, and explanations (Anthropic Claude)
- **User authentication** with NextAuth.js
- **Progress tracking** with submissions and solved status
- **Dark mode** with modern, premium UI design

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS |
| Editor | Monaco Editor (@monaco-editor/react) |
| Database | MongoDB Atlas |
| Auth | NextAuth.js v5 (Credentials) |
| AI | Anthropic SDK (Claude Haiku 4.5) |
| Runtime | Web Workers (sandboxed JS execution) |

## Project Structure

```
├── data/
│   ├── problems.json        # 25 seed problems
│   ├── raw/                  # Raw problem files for import
│   └── review.json           # AI-processed problems for review
├── scripts/
│   ├── seed.ts               # Seeds MongoDB from problems.json
│   └── import-problems.ts    # AI-converts raw problems to JSON
├── public/
│   └── worker.js             # Web Worker for code execution
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Problem list (home)
│   │   ├── globals.css       # Design system
│   │   ├── providers.tsx     # Session provider
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── problem/[slug]/page.tsx  # Editor + runner
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── problems/route.ts
│   │       ├── problems/[slug]/route.ts
│   │       ├── submissions/route.ts
│   │       ├── register/route.ts
│   │       ├── profile/route.ts
│   │       ├── hint/route.ts
│   │       ├── review/route.ts
│   │       └── explain/route.ts
│   ├── components/
│   │   └── Navbar.tsx
│   ├── lib/
│   │   ├── mongodb.ts        # MongoDB connection singleton
│   │   ├── auth.ts           # NextAuth config
│   │   ├── runner.ts         # Code runner (Web Worker wrapper)
│   │   └── ai-utils.ts       # AI rate limiting & caching
│   └── types/
│       ├── index.ts          # Core types
│       └── next-auth.d.ts    # NextAuth type augmentation
└── .env.example
```

## Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd DSA
npm install
```

### 2. MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/) and create a free cluster
2. Create a database user with read/write access
3. Whitelist your IP (or use `0.0.0.0/0` for development)
4. Get your connection string (click "Connect" → "Connect your application")
5. Replace `<username>`, `<password>`, and `<cluster>` in the connection string

### 3. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
MONGODB_URI=mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=dsa-practice
AUTH_SECRET=run-openssl-rand-base64-32-to-generate
AUTH_URL=http://localhost:3000
ANTHROPIC_API_KEY=sk-ant-your-key-here   # Optional, for AI features
```

Generate `AUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 4. Seed the Database

```bash
npm run seed
```

This loads all 25 problems from `data/problems.json` into MongoDB.

### 5. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Scripts

| Command | Description |
|---------|------------|
| `npm run dev` | Start development server |
| `npm run seed` | Seed problems into MongoDB |
| `npm run import-problems` | Convert raw problems (data/raw/) to JSON using AI |
| `npm run build` | Build for production |
| `npm run start` | Start production server |

## How to Import New Problems

1. Place raw problem descriptions (`.md` or `.txt`) in `data/raw/`
2. Run `npm run import-problems`
3. Review the output in `data/review.json`
4. Copy approved problems to `data/problems.json`
5. Run `npm run seed` to update the database

## AI Features

| Feature | Endpoint | Model | Requires |
|---------|----------|-------|----------|
| Hint | `/api/hint` | Claude Haiku 4.5 | Login |
| Code Review | `/api/review` | Claude Haiku 4.5 | Login |
| Explanation | `/api/explain` | Claude Haiku 4.5 | Login + Solved |

- Rate limited: 10 AI requests per user per day
- Hints are cached per problem to reduce API calls
- Explanations only available after solving the problem

## Code Execution Architecture

The code runner uses a Web Worker for sandboxed execution:

1. User code is sent to a Web Worker (`public/worker.js`)
2. The worker creates a function from the code using `new Function()`
3. Test cases are run against the function
4. Results are compared using `JSON.stringify()` equality
5. A 3-second timeout via `worker.terminate()` prevents infinite loops
6. Console.log output is captured and forwarded

The runner is in its own module (`src/lib/runner.ts`) and can be swapped for a Judge0 backend.

## License

MIT
