import mongoose from 'mongoose';

const TEST_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/pollhub_test';

export async function connectTestDB() {
  await mongoose.connect(TEST_URI);
}

export async function closeTestDB() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
}

export async function clearTestDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}
