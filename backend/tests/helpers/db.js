import mongoose from 'mongoose';
import User from '../../models/userModel.js';
import Company from '../../models/companyModel.js';
import JobPosting from '../../models/jobPostingModel.js';

export const connectTestDB = async () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('❌ Tests must run in NODE_ENV=test');
  }

  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('❌ MONGO_URI is not defined');
  }

  await mongoose.connect(uri);
  console.log('✅ Test database connected');
};

export const disconnectTestDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  console.log('✅ Test database disconnected');
};

export class TestDataTracker {
  constructor() {
    this.users = [];
    this.companies = [];
    this.jobs = [];
  }

  trackUser(userId) {
    this.users.push(userId);
  }

  trackCompany(companyId) {
    this.companies.push(companyId);
  }

  trackJob(jobId) {
    this.jobs.push(jobId);
  }

  async cleanup() {
    try {
      // Delete tracked data
      if (this.users.length > 0) {
        await User.deleteMany({ _id: { $in: this.users } });
      }
      if (this.companies.length > 0) {
        await Company.deleteMany({ _id: { $in: this.companies } });
      }
      if (this.jobs.length > 0) {
        await JobPosting.deleteMany({ _id: { $in: this.jobs } });
      }

      // Reset arrays
      this.users = [];
      this.companies = [];
      this.jobs = [];
    } catch (error) {
      console.error('❌ Cleanup error:', error);
      throw error;
    }
  }
}