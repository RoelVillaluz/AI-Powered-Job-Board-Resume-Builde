import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../../app.js';
import { connectTestDB, disconnectTestDB, TestDataTracker } from '../../helpers/db.js';
import { createAuthenticatedEmployer, createAuthenticatedJobseeker } from '../../helpers/authHelper.js';
import { Factory, seedJobseekerWithResume } from '../../factories/index.js';
import ResumeJobMatch from '../../../models/resumes/resumeJobMatchModel.js';
import Resume from '../../../models/resumes/resumeModel.js';
import User from '../../../models/UserModel.js';

describe('GET /:resumeId/job-matches – Get Resume Job Matches', () => {
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

  // ─── Success Cases ────────────────────────────────────────────────────────

  describe('Success Cases', () => {
    test('should return match data when fresh matches exist', async () => {
      const { jobseeker, token, resume } = await seedJobseekerWithResume(app, User, Resume);
      dataTracker.trackUser(jobseeker._id);
      dataTracker.trackResume(resume._id);

      const matchDoc = await Factory('resumeJobMatch')
        .as('withRichMatches')
        .with({ resume: resume._id })
        .for(ResumeJobMatch)
        .create();
      createdMatchIds.push(matchDoc._id);

      const response = await request(app)
        .get(`/api/resumes/${resume._id}/job-matches`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.formattedMessage).toMatch(/fetched successfully/i);
      expect(response.body.data).toHaveProperty('resume');
      expect(response.body.data).toHaveProperty('matches');
      expect(response.body.data.matches).toHaveLength(1);
      expect(response.body.data.matches[0].finalScore).toBe(85);
      expect(response.body.data.matches[0].recommendationType).toBe('Best Fit');
      expect(response.body.data.totalMatches).toBe(1);
      expect(response.body.data.usedPinecone).toBe(true);
    });

    test('should return 404 when no match result exists', async () => {
      const { jobseeker, token, resume } = await seedJobseekerWithResume(app, User, Resume);
      dataTracker.trackUser(jobseeker._id);
      dataTracker.trackResume(resume._id);

      const response = await request(app)
        .get(`/api/resumes/${resume._id}/job-matches`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(true);
      expect(response.body.formattedMessage).toMatch(/Resume Job Matches not found/i);
    });

    test('should return 404 when match result is stale (rankedAt > 1 day old)', async () => {
      const { jobseeker, token, resume } = await seedJobseekerWithResume(app, User, Resume);
      dataTracker.trackUser(jobseeker._id);
      dataTracker.trackResume(resume._id);

      const staleMatch = await Factory('resumeJobMatch')
        .as('withRichMatches', 'stale')
        .with({ resume: resume._id })
        .for(ResumeJobMatch)
        .create();
      createdMatchIds.push(staleMatch._id);

      const response = await request(app)
        .get(`/api/resumes/${resume._id}/job-matches`)
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
        .get(`/api/resumes/${resumeId}/job-matches`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should return 401 with invalid token', async () => {
      const resumeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/resumes/${resumeId}/job-matches`)
        .set('Authorization', 'Bearer invalid.token.here');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should return 403 for employer role', async () => {
      const { employer, token } = await createAuthenticatedEmployer(app);
      dataTracker.trackUser(employer._id);
      const resumeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/resumes/${resumeId}/job-matches`)
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
        .get(`/api/resumes/${nonExistentId}/job-matches`)
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
        .get(`/api/resumes/${resume._id}/job-matches`)
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
        .get('/api/resumes/not-a-valid-id/job-matches')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
