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

  // Check if URI contains 'test' to prevent accidental production DB connection
  if (!uri.includes('test')) {
    throw new Error('❌ MONGO_URI must contain "test" in the database name');
  }

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
};

export const disconnectTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
};

/**
 * Clears only the test collections, not the entire database
 * This is safer and prevents accidental data loss
 */
export const clearTestCollections = async () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('❌ Can only clear collections in test environment');
  }

  const collections = mongoose.connection.collections;
  
  // Only clear specific collections used in tests
  const testCollections = ['users', 'companies', 'jobpostings', 'resumes'];
  
  for (const collectionName of testCollections) {
    if (collections[collectionName]) {
      await collections[collectionName].deleteMany({});
    }
  }
}

/**
 * Alternative: Clear only documents created during current test
 * Track IDs and delete only those specific documents
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

  trackUser(userId) {
    this.createdIds.users.push(userId);
  }

  trackCompany(companyId) {
    this.createdIds.companies.push(companyId);
  }

  trackJob(jobId) {
    this.createdIds.jobs.push(jobId);
  }

  trackResume(resumeId) {
    this.createdIds.resumes.push(resumeId);
  }

  async cleanup() {
    // Delete in reverse order to respect foreign key relationships
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