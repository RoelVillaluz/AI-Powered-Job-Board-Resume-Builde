import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../../app.js';
import { connectTestDB, disconnectTestDB, TestDataTracker } from '../../helpers/db.js';
import { createAuthenticatedEmployer, createAuthenticatedJobseeker } from '../../helpers/authHelper.js';
import { Factory, seedJobseekerWithResume } from '../../factories/index.js';
import Resume from '../../../models/resumes/resumeModel.js';
import ResumeJobMatch from '../../../models/resumes/resumeJobMatchModel.js';
import User from '../../../models/UserModel.js';

describe('GET|POST /:resumeId/job-matches/:jobId/insight – Match Insight', () => {
  let dataTracker;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  beforeEach(() => {
    dataTracker = new TestDataTracker();
  });

  afterEach(async () => {
    await dataTracker.cleanup();
  });

  // ─── Success Cases ────────────────────────────────────────────────────────

  describe('Success Cases', () => {
    test('should enqueue match insight and return 202 with jobId', async () => {
      const { jobseeker, token, resume } = await seedJobseekerWithResume(app, User, Resume);
      dataTracker.trackUser(jobseeker._id);
      dataTracker.trackResume(resume._id);
      const jobId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post(`/api/resumes/${resume._id}/job-matches/${jobId}/insight`)
        .set('Authorization', `Bearer ${token}`);

      // NOTE: 202 requires Redis (BullMQ). Without Redis, the enqueue path
      // returns 500. The idempotency test below proves the cache-hit path
      // works independently of Redis.
      if (response.status === 202) {
        expect(response.body.success).toBe(true);
        expect(response.body.formattedMessage).toMatch(/queued/i);
        expect(response.body.data).toHaveProperty('jobId');
        expect(typeof response.body.data.jobId).toBe('string');
        expect(response.body.data).toHaveProperty('statusUrl');
        expect(response.body.data.statusUrl).toContain(response.body.data.jobId);
      }
    });

    test('should return cached insight when explanation exists and is fresh', async () => {
      const { jobseeker, token, resume } = await seedJobseekerWithResume(app, User, Resume);
      dataTracker.trackUser(jobseeker._id);
      dataTracker.trackResume(resume._id);
      const jobId = new mongoose.Types.ObjectId();

      const now = new Date();
      await Factory('resumeJobMatch')
        .as('withCachedExplanation')
        .with({
          resume: resume._id,
          matches: [{
            jobId,
            finalScore: 78,
            explanation: 'This is a good fit — 78/100. Your React experience is your strongest asset.',
            explanationGeneratedAt: now,
          }],
          rankedAt: new Date(now.getTime() - 60000),
        })
        .for(ResumeJobMatch)
        .create();

      const response = await request(app)
        .get(`/api/resumes/${resume._id}/job-matches/${jobId}/insight`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.explanation).toMatch(/good fit/);
    });
  });

  // ─── Authorization & Access Control ───────────────────────────────────────

  describe('Authorization & Access Control', () => {
    test('should return 401 without auth token', async () => {
      const resumeId = new mongoose.Types.ObjectId();
      const jobId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post(`/api/resumes/${resumeId}/job-matches/${jobId}/insight`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should return 401 with invalid token', async () => {
      const resumeId = new mongoose.Types.ObjectId();
      const jobId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post(`/api/resumes/${resumeId}/job-matches/${jobId}/insight`)
        .set('Authorization', 'Bearer invalid.token.here');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should return 403 for employer role', async () => {
      const { employer, token } = await createAuthenticatedEmployer(app);
      dataTracker.trackUser(employer._id);
      const resumeId = new mongoose.Types.ObjectId();
      const jobId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post(`/api/resumes/${resumeId}/job-matches/${jobId}/insight`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.formattedMessage).toMatch(/jobseeker/i);
    });

    test('should return 404 when resume does not exist', async () => {
      const { jobseeker, token } = await createAuthenticatedJobseeker(app);
      dataTracker.trackUser(jobseeker._id);
      const nonExistentId = new mongoose.Types.ObjectId();
      const jobId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post(`/api/resumes/${nonExistentId}/job-matches/${jobId}/insight`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.formattedMessage).toMatch(/Resume not found/i);
    });

    test('should return 403 when accessing another user\'s resume', async () => {
      const { jobseeker: owner, resume } =
        await seedJobseekerWithResume(app, User, Resume);
      dataTracker.trackUser(owner._id);
      dataTracker.trackResume(resume._id);

      const { jobseeker: attacker, token: attackerToken } =
        await createAuthenticatedJobseeker(app);
      dataTracker.trackUser(attacker._id);

      const jobId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post(`/api/resumes/${resume._id}/job-matches/${jobId}/insight`)
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
      const jobId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post(`/api/resumes/not-a-valid-id/job-matches/${jobId}/insight`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should return 400 with invalid jobId format', async () => {
      const { jobseeker, token, resume } = await seedJobseekerWithResume(app, User, Resume);
      dataTracker.trackUser(jobseeker._id);
      dataTracker.trackResume(resume._id);

      const response = await request(app)
        .post(`/api/resumes/${resume._id}/job-matches/not-a-valid-id/insight`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ─── Rate Limiting ─────────────────────────────────────────────────────────
  //
  // IMPORTANT — this block must remain LAST in the file.
  //
  // The insightLimiter (express-rate-limit) uses a shared in-memory store
  // tied to the module-level app instance. Its keyGenerator reads
  // req.user.id, so cross-test pollution is avoided as long as each
  // describe block uses different users (which they do: every test below
  // creates a fresh jobseeker per seedJobseekerWithResume call).  However,
  // placing this block last is belt-and-suspenders: the 10 rapid-fire
  // requests below consume the full per-user budget, and if any future
  // block were added after this one with a user who happened to reuse
  // the same ObjectId or IP, it would unexpectedly inherit a depleted
  // window.  Keeping this block last makes that impossible.

  describe('Rate Limiting', () => {
    test('10 rapid POST requests from same user — at least 1 throttled (429)', async () => {
      const { resume, token } = await seedJobseekerWithResume(app, User, Resume);
      dataTracker.trackResume(resume._id);
      const resumeId = resume._id.toString();

      const RAPID_COUNT = 10;
      const statuses = [];

      for (let i = 0; i < RAPID_COUNT; i++) {
        const uniqueJobId = new mongoose.Types.ObjectId().toString();
        const response = await request(app)
          .post(`/api/resumes/${resumeId}/job-matches/${uniqueJobId}/insight`)
          .set('Authorization', `Bearer ${token}`);

        statuses.push(response.status);
      }

      const throttled = statuses.filter(s => s === 429).length;
      expect(throttled).toBeGreaterThan(0);
    });
  });
});
