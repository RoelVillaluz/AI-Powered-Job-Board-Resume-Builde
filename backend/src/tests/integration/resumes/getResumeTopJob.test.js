import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../../app.js';
import { connectTestDB, disconnectTestDB, TestDataTracker } from '../../helpers/db.js';
import { createAuthenticatedEmployer, createAuthenticatedJobseeker } from '../../helpers/authHelper.js';
import { seedFullScenario, seedJobseekerWithResume } from '../../factories/index.js';
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

  const createTopMatchData = async (resumeId, jobId, overrides = {}) => {
    const doc = await ResumeJobMatch.create({
      resume: resumeId,
      matches: [
        {
          jobId,
          finalScore: 92,
          vectorSimilarity: 0.85,
          components: {
            skillMatch: 90,
            experienceFit: 85,
            semanticSim: 80,
            seniorityFit: 75,
            locationFit: 95,
            certBonus: 60,
          },
          careerFit: 'Strong',
          recommendationType: 'Best Fit',
          matchedSkills: ['JavaScript', 'Node.js', 'MongoDB'],
          missingSkills: ['Python'],
          missingRequiredSkills: [],
          strengths: ['Excellent technical alignment'],
          improvements: ['Consider adding cloud experience'],
          penalties: [],
          metadata: {
            title: 'Senior Engineer',
            location: 'Remote',
            experienceLevel: 'Senior',
            jobType: 'Full-Time',
            salaryMin: 100000,
            salaryMax: 150000,
            salaryCurrency: '$',
            salaryFrequency: 'year',
          },
        },
      ],
      totalMatches: 1,
      usedPinecone: true,
      rankedAt: new Date(),
      ...overrides,
    });
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
