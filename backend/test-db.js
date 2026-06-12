/**
 * Test MongoDB connection. Run: node test-db.js
 */
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const test = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('FAIL: MONGODB_URI is missing in backend/.env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  console.log('URI:', uri.replace(/:([^@/]+)@/, ':****@')); // hide password in log

  try {
    await mongoose.connect(uri);
    const { host, name } = mongoose.connection;
    console.log('SUCCESS: Connected to MongoDB');
    console.log(`  Host: ${host}`);
    console.log(`  Database: ${name}`);

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`  Collections (${collections.length}):`, collections.map((c) => c.name).join(', ') || '(empty — run node seed.js)');
    process.exit(0);
  } catch (err) {
    console.error('FAIL:', err.message);
    console.error('\nFix:');
    console.error('  1. Start MongoDB locally, OR use MongoDB Atlas (cloud)');
    console.error('  2. Set MONGODB_URI in backend/.env');
    process.exit(1);
  }
};

test();
