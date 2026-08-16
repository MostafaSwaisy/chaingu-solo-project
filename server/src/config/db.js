import mongoose from 'mongoose';

export async function connectDB(uri) {
  await mongoose.connect(uri);
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
