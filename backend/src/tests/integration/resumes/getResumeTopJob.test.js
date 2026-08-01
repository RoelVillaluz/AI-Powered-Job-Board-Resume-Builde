import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../../app.js';
import { connectTestDB, disconnectTestDB, TestDataTracker } from '../../helpers/db.js';
import { createAuthenticatedEmployer, createAuthenticatedJobseeker } from '../../helpers/authHelper.js';
import { Factory, richMatchEntry, seedFullScenario, seedJobseekerWithResume } from '../../factories/index.js';
import ResumeJobMatch from '../../../models/resumes/resumeJobMatchModel.js';
import Resume from '../../../models/resumes/resumeModel.js';
import User from '../../../models/UserModel.js';
import Company from '../../../models/companyModel.js';
import JobPosting from '../../../models/jobPostings/jobPostingModel.js';

describe('GET /:resumeId/top-job – Get Top Job Match', () => {
  let dataTracker;
  let createdMatchIds = [];

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  beforeEach(() => {
    dataTracker = new TestDataTracker();
    createdMatchIds = [];
  });

  afterEach(async () => {
    await ResumeJobMatch.deleteMany({ _id: { $in: createdMatchIds } });
    await dataTracker.cleanup();
  });

  const createTopMatchData = async (resumeId, jobId) => {
    const doc = await Factory('resumeJobMatch')
      .as('withRichMatches')
      .with({
        resume: resumeId,
        matches: [richMatchEntry({ jobId, finalScore: 92 })],
      })
      .for(ResumeJobMatch)
      .create();
    createdMatchIds.push(doc._id);
    return doc;
  };

  // ─── Success Cases ────────────────────────────────────────────────────────

  describe('Success Cases', () => {
    test('should return top job merged with match data', async () => {
      const { jobseeker, token, resume, job, company, employer } =
        await seedFullScenario(app, User, Company, JobPosting, Resume);
      dataTracker.trackUser(jobseeker._id);
      dataTracker.trackUser(employer._id);
      dataTracker.trackResume(resume._id);
      dataTracker.trackCompany(company._id);
      dataTracker.trackJob(job._id);

      await createTopMatchData(resume._id, job._id);

      const response = await request(app)
        .get(`/api/resumes/${resume._id}/top-job`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.formattedMessage).toMatch(/fetched successfully/i);

      // Merged match fields
      expect(response.body.data).toHaveProperty('finalScore', 92);
      expect(response.body.data).toHaveProperty('recommendationType', 'Best Fit');
      expect(response.body.data).toHaveProperty('similarity');
      expect(response.body.data).toHaveProperty('matchedSkills');
      expect(response.body.data).toHaveProperty('missingSkills');

      // Job fields from spread
      expect(response.body.data).toHaveProperty('_id', job._id.toString());
      expect(response.body.data).toHaveProperty('description', job.description);
    });

    test('should return 404 when no matches exist', async () => {
      const { jobseeker, token, resume } =
        await seedJobseekerWithResume(app, User, Resume);
      dataTracker.trackUser(jobseeker._id);
      dataTracker.trackResume(resume._id);

      const response = await request(app)
        .get(`/api/resumes/${resume._id}/top-job`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(true);
      expect(response.body.formattedMessage).toMatch(/Top Job Match not found/i);
    });

    test('should return 404 when match references deleted job', async () => {
      const { jobseeker, token, resume, job, company, employer } =
        await seedFullScenario(app, User, Company, JobPosting, Resume);
      dataTracker.trackUser(jobseeker._id);
      dataTracker.trackUser(employer._id);
      dataTracker.trackResume(resume._id);
      dataTracker.trackJob(job._id);
      dataTracker.trackCompany(company._id);

      await createTopMatchData(resume._id, job._id);

      await JobPosting.deleteOne({ _id: job._id });

      const response = await request(app)
        .get(`/api/resumes/${resume._id}/top-job`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(true);
    });
  });

  // ─── Authorization & Access Control ───────────────────────────────────────

  describe('Authorization & Access Control', () => {
    test('should return 401 without auth token', async () => {
      const resumeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/resumes/${resumeId}/top-job`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should return 401 with invalid token', async () => {
      const resumeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/resumes/${resumeId}/top-job`)
        .set('Authorization', 'Bearer invalid.token.here');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should return 403 for employer role', async () => {
      const { employer, token } = await createAuthenticatedEmployer(app);
      dataTracker.trackUser(employer._id);
      const resumeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/resumes/${resumeId}/top-job`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.formattedMessage).toMatch(/jobseeker/i);
    });

    test('should return 404 when resume does not exist', async () => {
      const { jobseeker, token } = await createAuthenticatedJobseeker(app);
      dataTracker.trackUser(jobseeker._id);
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/resumes/${nonExistentId}/top-job`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.formattedMessage).toMatch(/Resume not found/i);
    });

    test('should return 403 when accessing another user\'s resume', async () => {
      const { jobseeker: owner, token: ownerToken, resume } =
        await seedJobseekerWithResume(app, User, Resume);
      dataTracker.trackUser(owner._id);
      dataTracker.trackResume(resume._id);

      const { jobseeker: attacker, token: attackerToken } =
        await createAuthenticatedJobseeker(app);
      dataTracker.trackUser(attacker._id);

      const response = await request(app)
        .get(`/api/resumes/${resume._id}/top-job`)
        .set('Authorization', `Bearer ${attackerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.formattedMessage).toMatch(/do not have access/i);
    });
  });

  // ─── Validation Failures ──────────────────────────────────────────────────

  describe('Validation Failures', () => {
    test('should return 400 with invalid resumeId format', async () => {
      const { jobseeker, token } = await createAuthenticatedJobseeker(app);
      dataTracker.trackUser(jobseeker._id);

      const response = await request(app)
        .get('/api/resumes/not-a-valid-id/top-job')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
