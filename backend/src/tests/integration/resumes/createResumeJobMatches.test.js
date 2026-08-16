import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../../app.js';
import { connectTestDB, disconnectTestDB, TestDataTracker } from '../../helpers/db.js';
import { createAuthenticatedEmployer, createAuthenticatedJobseeker } from '../../helpers/authHelper.js';
import { seedJobseekerWithResume } from '../../factories/index.js';
import Resume from '../../../models/resumes/resumeModel.js';
import User from '../../../models/UserModel.js';

describe('POST /:resumeId/job-matches – Enqueue Resume Job Matching', () => {
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
    test('should enqueue matching job and return 202 with jobId', async () => {
      const { jobseeker, token, resume } = await seedJobseekerWithResume(app, User, Resume);
      dataTracker.trackUser(jobseeker._id);
      dataTracker.trackResume(resume._id);

      const response = await request(app)
        .post(`/api/resumes/${resume._id}/job-matches`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(202);
      expect(response.body.success).toBe(true);
      expect(response.body.formattedMessage).toMatch(/queued/i);
      expect(response.body.data).toHaveProperty('jobId');
      expect(typeof response.body.data.jobId).toBe('string');
      expect(response.body.data).toHaveProperty('statusUrl');
      expect(response.body.data.statusUrl).toContain(response.body.data.jobId);
    });
  });

  // ─── Authorization & Access Control ───────────────────────────────────────

  describe('Authorization & Access Control', () => {
    test('should return 401 without auth token', async () => {
      const resumeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post(`/api/resumes/${resumeId}/job-matches`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should return 401 with invalid token', async () => {
      const resumeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post(`/api/resumes/${resumeId}/job-matches`)
        .set('Authorization', 'Bearer invalid.token.here');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should return 403 for employer role', async () => {
      const { employer, token } = await createAuthenticatedEmployer(app);
      dataTracker.trackUser(employer._id);
      const resumeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post(`/api/resumes/${resumeId}/job-matches`)
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
        .post(`/api/resumes/${nonExistentId}/job-matches`)
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

      const response = await request(app)
        .post(`/api/resumes/${resume._id}/job-matches`)
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
        .post('/api/resumes/not-a-valid-id/job-matches')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
