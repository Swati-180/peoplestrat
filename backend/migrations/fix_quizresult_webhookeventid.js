import mongoose from 'mongoose';

// One-off fix for E11000 duplicate key { webhookEventId: null }.
// Root cause: webhookEventId defaulted to null (indexed under the old sparse
// unique index), so the 2nd initiated QuizResult doc always collided.
// Fix: unset null placeholders, drop the old sparse index; the model now
// defines a partial unique index which the backend recreates on boot
// (or via QuizResult.createIndexes() below).
async function runMigration() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('ERROR: MONGO_URI environment variable is required.');
    process.exit(1);
  }

  console.log('Connecting to database...');
  await mongoose.connect(uri);
  console.log('Connected to:', mongoose.connection.name);

  const collection = mongoose.connection.collection('quizresults');

  const unsetRes = await collection.updateMany(
    { webhookEventId: null },
    { $unset: { webhookEventId: '' } }
  );
  console.log(`Unset null webhookEventId on ${unsetRes.modifiedCount} doc(s).`);

  try {
    await collection.dropIndex('webhookEventId_1');
    console.log('Dropped old webhookEventId_1 index.');
  } catch (err) {
    if (err?.codeName === 'IndexNotFound' || /index not found/i.test(err?.message || '')) {
      console.log('Old webhookEventId_1 index not present, nothing to drop.');
    } else {
      throw err;
    }
  }

  const { default: QuizResult } = await import('../models/QuizResult.js');
  await QuizResult.createIndexes();
  console.log('Recreated indexes from model:');
  console.table(await collection.indexes().then((idx) => idx.map((i) => ({ name: i.name, key: JSON.stringify(i.key), ...(i.partialFilterExpression ? { partial: JSON.stringify(i.partialFilterExpression) } : {}) }))));

  const remainingNulls = await collection.countDocuments({ webhookEventId: null });
  console.log(`Docs still carrying null webhookEventId: ${remainingNulls}`);

  await mongoose.disconnect();
  console.log('Done.');
}

runMigration().catch((err) => {
  console.error('Fatal Migration Error:', err);
  process.exit(1);
});
