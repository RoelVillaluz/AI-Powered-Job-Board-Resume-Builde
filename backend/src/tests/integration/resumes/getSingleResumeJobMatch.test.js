import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../../app.js';
import { connectTestDB, disconnectTestDB, TestDataTracker } from '../../helpers/db.js';
import { createAuthenticatedEmployer, createAuthenticatedJobseeker } from '../../helpers/authHelper.js';
import { Factory, richMatchEntry, seedJobseekerWithResume } from '../../factories/index.js';
import ResumeJobMatch from '../../../models/resumes/resumeJobMatchModel.js';
import Resume from '../../../models/resumes/resumeModel.js';
import User from '../../../models/UserModel.js';

describe('GET /:resumeId/job-matches/:jobId – Get Single Job Match', () => {
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

  const jobId1 = new mongoose.Types.ObjectId();
  const jobId2 = new mongoose.Types.ObjectId();

  const createMatches = async (resumeId) => {
    const doc = await Factory('resumeJobMatch')
      .as('withRichMatches')
      .with({
        resume: resumeId,
        matches: [
          richMatchEntry({ jobId: jobId1, finalScore: 92, components: { skillMatch: 90 } }),
          richMatchEntry({
            jobId: jobId2,
            finalScore: 65,
            vectorSimilarity: 0.45,
            components: {
              skillMatch: 50,
              experienceFit: 40,
              semanticSim: 45,
              seniorityFit: 30,
              locationFit: 60,
              certBonus: 20,
            },
            careerFit: 'Weak',
            recommendationType: 'Stretch',
            missingRequiredSkills: ['Node.js'],
          }),
        ],
        totalMatches: 2,
      })
      .for(ResumeJobMatch)
      .create();
    createdMatchIds.push(doc._id);
    return doc;
  };

  // ─── Success Cases ────────────────────────────────────────────────────────

  describe('Success Cases', () => {
    test('should return single job match by jobId', async () => {
      const { jobseeker, token, resume } = await seedJobseekerWithResume(app, User, Resume);
      dataTracker.trackUser(jobseeker._id);
      dataTracker.trackResume(resume._id);

      await createMatches(resume._id);

      const response = await request(app)
        .get(`/api/resumes/${resume._id}/job-matches/${jobId1}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('jobId');
      expect(response.body.data.jobId.toString()).toBe(jobId1.toString());
      expect(response.body.data.finalScore).toBe(92);
      expect(response.body.data.recommendationType).toBe('Best Fit');
      expect(response.body.data.components.skillMatch).toBe(90);
      expect(response.body.data.matchedSkills).toContain('JavaScript');

      // Second match
      const response2 = await request(app)
        .get(`/api/resumes/${resume._id}/job-matches/${jobId2}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response2.status).toBe(200);
      expect(response2.body.data.finalScore).toBe(65);
      expect(response2.body.data.recommendationType).toBe('Stretch');
    });

    test('should return 404 when jobId not found in matches', async () => {
      const { jobseeker, token, resume } = await seedJobseekerWithResume(app, User, Resume);
      dataTracker.trackUser(jobseeker._id);
      dataTracker.trackResume(resume._id);

      await createMatches(resume._id);
      const unknownJobId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/resumes/${resume._id}/job-matches/${unknownJobId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(true);
      expect(response.body.formattedMessage).toMatch(/Resume Job Match not found/i);
    });

    test('should return 404 when no ResumeJobMatch document exists', async () => {
      const { jobseeker, token, resume } = await seedJobseekerWithResume(app, User, Resume);
      dataTracker.trackUser(jobseeker._id);
      dataTracker.trackResume(resume._id);
      const someJobId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/resumes/${resume._id}/job-matches/${someJobId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(true);
    });
  });

  // ─── Authorization & Access Control ───────────────────────────────────────

  describe('Authorization & Access Control', () => {
    test('should return 401 without auth token', async () => {
      const resumeId = new mongoose.Types.ObjectId();
      const jobId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/resumes/${resumeId}/job-matches/${jobId}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should return 401 with invalid token', async () => {
      const resumeId = new mongoose.Types.ObjectId();
      const jobId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/resumes/${resumeId}/job-matches/${jobId}`)
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
        .get(`/api/resumes/${resumeId}/job-matches/${jobId}`)
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
        .get(`/api/resumes/${nonExistentId}/job-matches/${jobId}`)
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

      const jobId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/resumes/${resume._id}/job-matches/${jobId}`)
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
        .get(`/api/resumes/not-a-valid-id/job-matches/${jobId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should return 400 with invalid jobId format', async () => {
      const { jobseeker, token, resume } = await seedJobseekerWithResume(app, User, Resume);
      dataTracker.trackUser(jobseeker._id);
      dataTracker.trackResume(resume._id);

      const response = await request(app)
        .get(`/api/resumes/${resume._id}/job-matches/not-a-valid-id`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
