import { MongoClient } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';

async function pushProblems() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || 'dsa-practice';

  if (!uri) {
    console.error('❌ MONGODB_URI not set. Please ensure .env.local has MONGODB_URI.');
    process.exit(1);
  }

  console.log('🔌 Connecting to MongoDB Atlas...');
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    const db = client.db(dbName);
    const problemsCollection = db.collection('problems');

    // Read problems from JSON
    const problemsPath = path.join(process.cwd(), 'data', 'problems.json');
    const rawData = fs.readFileSync(problemsPath, 'utf-8');
    const problems = JSON.parse(rawData);

    console.log(`📦 Loaded ${problems.length} total problems from data/problems.json`);

    let insertedCount = 0;
    let updatedCount = 0;

    for (const problem of problems) {
      const result = await problemsCollection.updateOne(
        { slug: problem.slug },
        { $set: problem },
        { upsert: true }
      );

      if (result.upsertedCount > 0) {
        insertedCount++;
      } else if (result.modifiedCount > 0) {
        updatedCount++;
      }
    }

    // Ensure indexes exist
    await problemsCollection.createIndex({ slug: 1 }, { unique: true });
    await problemsCollection.createIndex({ topic: 1 });
    await problemsCollection.createIndex({ difficulty: 1 });
    await problemsCollection.createIndex({ number: 1 });

    console.log(`\n🎉 Database push completed successfully!`);
    console.log(`   Database: ${dbName}`);
    console.log(`   New problems inserted: ${insertedCount}`);
    console.log(`   Existing problems updated: ${updatedCount}`);
    console.log(`   Total problems in JSON: ${problems.length}`);
  } catch (error) {
    console.error('❌ Failed to push problems to database:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

pushProblems();
