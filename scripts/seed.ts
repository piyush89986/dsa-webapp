import { MongoClient } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';

async function seed() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || 'dsa-practice';

  if (!uri) {
    console.error('❌ MONGODB_URI not set. Add it to .env.local');
    process.exit(1);
  }

  console.log('🔌 Connecting to MongoDB Atlas...');
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    const db = client.db(dbName);

    // Read problems from JSON file
    const problemsPath = path.join(process.cwd(), 'data', 'problems.json');
    const rawData = fs.readFileSync(problemsPath, 'utf-8');
    const problems = JSON.parse(rawData);

    console.log(`📦 Found ${problems.length} problems to seed`);

    // Clear existing problems
    await db.collection('problems').deleteMany({});
    console.log('🧹 Cleared existing problems');

    // Insert problems
    const result = await db.collection('problems').insertMany(problems);
    console.log(`✅ Seeded ${result.insertedCount} problems`);

    // Create indexes
    await db.collection('problems').createIndex({ slug: 1 }, { unique: true });
    await db.collection('problems').createIndex({ topic: 1 });
    await db.collection('problems').createIndex({ difficulty: 1 });
    await db.collection('problems').createIndex({ number: 1 });
    await db.collection('submissions').createIndex({ userId: 1, problemId: 1 });
    await db.collection('submissions').createIndex({ timestamp: -1 });
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('hint_cache').createIndex({ problemId: 1 }, { unique: true });
    console.log('📇 Created indexes');

    console.log('\n🎉 Seeding complete!');
    console.log(`   Database: ${dbName}`);
    console.log(`   Problems: ${result.insertedCount}`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seed();
