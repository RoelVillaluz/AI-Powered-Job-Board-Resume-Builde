import request from 'supertest';
import app from '../../../app.js';
import { connectTestDB, disconnectTestDB, TestDataTracker } from '../../helpers/db.js';
import { createAuthenticatedJobseeker } from '../../helpers/authHelper.js';
import { Factory } from '../../factories/index.js';
import Resume from '../../../models/resumes/resumeModel.js';

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
      // Arrange — jobseeker exists in DB via auth helper
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

      // Assert — skills shape
      expect(response.body.data.skills).toHaveLength(resumeData.skills.length);
      response.body.data.skills.forEach((skill, i) => {
        expect(skill.name).toBe(resumeData.skills[i].name);
        expect(skill.level).toBe(resumeData.skills[i].level);
        expect(skill).toHaveProperty('_id');
      });

      // Assert — certifications shape
      expect(response.body.data.certifications).toHaveLength(resumeData.certifications.length);
      response.body.data.certifications.forEach((cert, i) => {
        expect(cert.name).toBe(resumeData.certifications[i].name);
        expect(cert.year).toBe(resumeData.certifications[i].year);
      });

      dataTracker.trackResume(response.body.data._id);

      // Verify DB
      const saved = await Resume.findById(response.body.data._id);
      expect(saved).toBeTruthy();
      expect(saved.firstName).toBe(resumeData.firstName);
    });

    test('should create resume with no work experience', async () => {
      // Arrange
      const { jobseeker, token } = await createAuthenticatedJobseeker(app);
      dataTracker.trackUser(jobseeker._id);

      const resumeData = await Factory('resume')
        .as('noExperience')
        .with({ user: jobseeker._id })
        .build();

      // Act
      const response = await request(app)
        .post('/api/resumes')
        .set('Authorization', `Bearer ${token}`)
        .send(resumeData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.data.workExperience).toHaveLength(0);

      dataTracker.trackResume(response.body.data._id);
    });
  });
});