import mongoose from 'mongoose';

export const connectTestDB = async () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('❌ Tests must run in NODE_ENV=test');
  }

  const uri = process.env.MONGO_TEST_URI;

  if (!uri) {
    throw new Error('❌ MONGO_TEST_URI is not defined');
  }

  await mongoose.connect(uri);
};

export const disconnectTestDB = async () => {
  await mongoose.connection.close();
};
