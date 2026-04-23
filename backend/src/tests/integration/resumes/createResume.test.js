import request from 'supertest';
import app from '../../../app.js';
import { connectTestDB, disconnectTestDB, TestDataTracker } from '../../helpers/db.js';
import { createAuthenticatedEmployer, createAuthenticatedJobseeker } from '../../helpers/authHelper.js';
import { Factory } from '../../factories/index.js';
import Resume from '../../../models/resumes/resumeModel.js';
import mongoose from 'mongoose';

describe('POST /api/resumes - Create Resume', () => {
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

  // ─── Success Cases ──────────────────────────────────────────────────────────

  describe('Success Cases', () => {
    test('should create a resume with valid jobseeker credentials', async () => {
      // Arrange
      const { jobseeker, token } = await createAuthenticatedJobseeker(app);
      dataTracker.trackUser(jobseeker._id);

      const resumeData = await Factory('resume').with({ user: jobseeker._id }).build();

      // Act
      const response = await request(app)
        .post('/api/resumes')
        .set('Authorization', `Bearer ${token}`)
        .send(resumeData);

      // Assert — response shape
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.formattedMessage).toMatch(/Resume created successfully/i);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.user.toString()).toBe(jobseeker._id.toString());
      expect(response.body.data.firstName).toBe(resumeData.firstName);
      expect(response.body.data.lastName).toBe(resumeData.lastName);
      expect(response.body.data.phone).toBe(resumeData.phone);
      expect(response.body.data.summary).toBe(resumeData.summary);

      // Assert — location shape
      expect(response.body.data.location).toHaveProperty('name', resumeData.location.name);

      // Assert — jobTitle shape
      expect(response.body.data.jobTitle).toHaveProperty('name', resumeData.jobTitle.name);

      // Assert — skills shape
      // Note: Mongoose generates its own subdocument _id — factory _id is not persisted
      expect(response.body.data.skills).toHaveLength(resumeData.skills.length);
      response.body.data.skills.forEach((skill, i) => {
        expect(skill).toHaveProperty('_id');         // Mongoose-generated, just assert exists
        expect(skill.name).toBe(resumeData.skills[i].name);
        expect(skill.level).toBe(resumeData.skills[i].level);
      });

      // Assert — certifications shape
      expect(response.body.data.certifications).toHaveLength(resumeData.certifications.length);
      response.body.data.certifications.forEach((cert, i) => {
        expect(cert.name).toBe(resumeData.certifications[i].name);
        expect(cert.year).toBe(resumeData.certifications[i].year);
      });

      // Assert — work experience shape
      expect(response.body.data.workExperience).toHaveLength(resumeData.workExperience.length);
      expect(response.body.data.workExperience[0].jobTitle).toBe(resumeData.workExperience[0].jobTitle);
      expect(response.body.data.workExperience[0].company).toBe(resumeData.workExperience[0].company);

      // Assert — defaults
      expect(response.body.data.predictedSalary).toBe(0);

      dataTracker.trackResume(response.body.data._id);

      // Verify DB
      const saved = await Resume.findById(response.body.data._id);
      expect(saved).toBeTruthy();
      expect(saved.firstName).toBe(resumeData.firstName);
      expect(saved.skills).toHaveLength(resumeData.skills.length);
    });

    test('should create resume with no work experience', async () => {
      const { jobseeker, token } = await createAuthenticatedJobseeker(app);
      dataTracker.trackUser(jobseeker._id);

      const resumeData = await Factory('resume')
        .as('noExperience')
        .with({ user: jobseeker._id })
        .build();

      const response = await request(app)
        .post('/api/resumes')
        .set('Authorization', `Bearer ${token}`)
        .send(resumeData);

      expect(response.status).toBe(201);
      expect(response.body.data.workExperience).toHaveLength(0);

      dataTracker.trackResume(response.body.data._id);
    });

    test('should default predictedSalary to 0 when not provided', async () => {
      const { jobseeker, token } = await createAuthenticatedJobseeker(app);
      dataTracker.trackUser(jobseeker._id);

      const resumeData = await Factory('resume').with({ user: jobseeker._id }).build();
      delete resumeData.predictedSalary;

      const response = await request(app)
        .post('/api/resumes')
        .set('Authorization', `Bearer ${token}`)
        .send(resumeData);

      expect(response.status).toBe(201);
      expect(response.body.data.predictedSalary).toBe(0);

      dataTracker.trackResume(response.body.data._id);
    });
  });

  // ─── Validation Failures ────────────────────────────────────────────────────

  describe('Validation Failures', () => {
    test('should fail without required fields', async () => {
      const { jobseeker, token } = await createAuthenticatedJobseeker(app);
      dataTracker.trackUser(jobseeker._id);

      // Intentionally omit firstName, lastName, phone, summary
      const response = await request(app)
        .post('/api/resumes')
        .set('Authorization', `Bearer ${token}`)
        .send({ user: jobseeker._id });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail if skill level is an invalid enum value', async () => {
      const { jobseeker, token } = await createAuthenticatedJobseeker(app);
      dataTracker.trackUser(jobseeker._id);

      const resumeData = await Factory('resume')
        .with({
          user: jobseeker._id,
          skills: [{ name: 'JavaScript', level: 'InvalidLevel' }],
        })
        .build();

      const response = await request(app)
        .post('/api/resumes')
        .set('Authorization', `Bearer ${token}`)
        .send(resumeData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ─── Authorization Failures ─────────────────────────────────────────────────

  describe('Authorization Failures', () => {
    test('should fail without authentication token', async () => {
      const resumeData = await Factory('resume').build();

      const response = await request(app)
        .post('/api/resumes')
        .send(resumeData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.formattedMessage).toMatch(/No authentication token provided/i);
    });

    test('should fail with invalid token', async () => {
      const resumeData = await Factory('resume').build();

      const response = await request(app)
        .post('/api/resumes')
        .set('Authorization', 'Bearer invalid.token.here')
        .send(resumeData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should fail if user is not a jobseeker', async () => {
      const { employer, token } = await createAuthenticatedEmployer(app);
      dataTracker.trackUser(employer._id);

      const resumeData = await Factory('resume').with({ user: employer._id }).build();

      const response = await request(app)
        .post('/api/resumes')
        .set('Authorization', `Bearer ${token}`)
        .send(resumeData);

      expect(response.status).toBe(403);
      expect(response.body.formattedMessage).toMatch(/jobseeker/i);
    });
  });
});