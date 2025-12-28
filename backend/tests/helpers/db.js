import mongoose from 'mongoose';
import User from '../../models/userModel.js';
import Company from '../../models/companyModel.js';
import JobPosting from '../../models/jobPostingModel.js';
import Resume from '../../models/resumeModel.js';

export const connectTestDB = async () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('❌ Tests must run in NODE_ENV=test');
  }

  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('❌ MONGO_URI is not defined');
  }

  // Ensure we don't connect to a non-test database
  if (!uri.includes('test')) {
    throw new Error('❌ MONGO_URI must contain "test" in the database name');
  }

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
    console.log('✅ Test database connected');
  }
};

export const disconnectTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase(); // optional: drop DB on disconnect
    await mongoose.connection.close();
    console.log('✅ Test database disconnected');
  }
};

/**
 * Clears only the test collections, safer than dropping the whole DB
 */
export const clearTestCollections = async () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('❌ Can only clear collections in test environment');
  }

  const collections = mongoose.connection.collections;
  const testCollections = ['users', 'companies', 'jobpostings', 'resumes'];

  for (const name of testCollections) {
    if (collections[name]) {
      await collections[name].deleteMany({});
    }
  }
};

/**
 * Tracks created test data for selective cleanup
 */
export class TestDataTracker {
  constructor() {
    this.createdIds = {
      users: [],
      companies: [],
      jobs: [],
      resumes: []
    };
  }

  trackUser(id) { this.createdIds.users.push(id); }
  trackCompany(id) { this.createdIds.companies.push(id); }
  trackJob(id) { this.createdIds.jobs.push(id); }
  trackResume(id) { this.createdIds.resumes.push(id); }

  async cleanup() {
    // Delete in reverse order to respect references
    await JobPosting.deleteMany({ _id: { $in: this.createdIds.jobs } });
    await Company.deleteMany({ _id: { $in: this.createdIds.companies } });
    await Resume.deleteMany({ _id: { $in: this.createdIds.resumes } });
    await User.deleteMany({ _id: { $in: this.createdIds.users } });

    // Reset tracking
    this.createdIds = {
      users: [],
      companies: [],
      jobs: [],
      resumes: []
    };
  }
}
