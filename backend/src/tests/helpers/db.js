import mongoose from 'mongoose';
import User from '../../models/UserModel.js';
import Company from '../../models/companyModel.js';
import JobPosting from '../../models/jobPostings/jobPostingModel.js';
import ResumeScore from '../../models/resumes/resumeScoreModel.js';
import ResumeEmbedding from '../../models/resumes/resumeEmbeddingsModel.js';
import Resume from '../../models/resumes/resumeModel.js';
import { allQueues } from "../../../src/queues/index.js"
import logger from "../../../src/utils/logger.js"
import { TempUser } from '../../models/tempUserModel.js';

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
    console.log('✅ Test database connected'); // keep log from test branch
  }
};

export const disconnectTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase(); // optional: only if you want a clean slate
    await mongoose.connection.close();

    // Safely close Redis — it may never have connected in CI where Redis isn't running
    try {
      if (redisClient.status !== 'end' && redisClient.status !== 'close') {
        await redisClient.quit();
      }
    } catch {
      // Redis was never connected — safe to ignore
    }

    // Safely close all BullMQ queues
    for (const queue of allQueues) {
      try {
        await queue.close();
      } catch {
        // Queue may already be closed — safe to ignore
      }
    }

    logger.info('✅ Test database disconnected'); // keep log from test branch
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
  const testCollections = ['tempUsers', 'users', 'companies', 'jobpostings', 'resumes', 'resumeEmbeddings', 'resumeScores'];

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
      tempUsers: [],
      users: [],
      companies: [],
      jobs: [],
      resumeScores: [],
      resumeEmbeddings: [],
      resumes: []
    };
  }

  trackUser(id) { this.createdIds.users.push(id); }
  trackCompany(id) { this.createdIds.companies.push(id); }
  trackJob(id) { this.createdIds.jobs.push(id); }
  trackResumeScore(id) { this.createdIds.resumeScores.push(id); }
  trackResumeEmbedding(id) { this.createdIds.resumeEmbeddings.push(id); }
  trackResume(id) { this.createdIds.resumes.push(id); }

  async cleanup() {
    // Delete in reverse order to respect foreign key relationships
    await JobPosting.deleteMany({ _id: { $in: this.createdIds.jobs } });
    await Company.deleteMany({ _id: { $in: this.createdIds.companies } });

    await ResumeScore.deleteMany({ _id: { $in: this.createdIds.resumeScores } });
    await ResumeEmbedding.deleteMany({ _id: { $in: this.createdIds.resumeEmbeddings }});
    await Resume.deleteMany({ _id: { $in: this.createdIds.resumes } });

    await User.deleteMany({ _id: { $in: this.createdIds.users } });
    await TempUser.deleteMany({ _id: { $in: this.createdIds.tempUsers } });

    // Reset tracking
    this.createdIds = {
      tempUsers: [],
      users: [],
      companies: [],
      jobs: [],
      resumeScores: [],
      resumeEmbeddings: [],
      resumes: [],
    };
  }
}
