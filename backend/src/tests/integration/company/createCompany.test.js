import request from 'supertest';
import app from '../../../app.js';
import { connectTestDB, disconnectTestDB, TestDataTracker } from '../../helpers/db.js';
import { createAuthenticatedEmployer, createAuthenticatedUser } from '../../helpers/authHelper.js';
import { Factory, seedEmployerWithCompany } from '../../factories/index.js';
import Company from '../../../models/companyModel.js';
import User from '../../../models/UserModel.js';

describe('POST /api/companies - Create Company', () => {
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
    test('should create a company with valid employer credentials', async () => {
      // Arrange
      const { employer, token } = await createAuthenticatedEmployer(app);
      dataTracker.trackUser(employer._id);

      const companyData = await Factory('company').with({ user: employer._id }).build();

      // Act
      const response = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${token}`)
        .send(companyData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.formattedMessage).toMatch(/Company created successfully/i);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.name).toBe(companyData.name);
      expect(response.body.data.industry).toEqual(companyData.industry);
      expect(String(response.body.data.location._id)).toBe(String(companyData.location._id));
      expect(response.body.data.location.name).toBe(companyData.location.name);
      expect(response.body.data.user.toString()).toBe(employer._id.toString());

      dataTracker.trackCompany(response.body.data._id);

      // Verify DB
      const saved = await Company.findById(response.body.data._id);
      expect(saved).toBeTruthy();
      expect(saved.name).toBe(companyData.name);
    });

    test('should create company with optional fields', async () => {
      const { employer, token } = await createAuthenticatedEmployer(app);
      dataTracker.trackUser(employer._id);

      const companyData = await Factory('company')
        .with({
          user:   employer._id,
          logo:   'https://example.com/logo.png',
          banner: 'https://example.com/banner.png',
          images: ['https://example.com/img1.png', 'https://example.com/img2.png'],
          ceo:    { name: 'John Doe', image: 'https://example.com/ceo.png' },
        })
        .build();

      const response = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${token}`)
        .send(companyData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.logo).toBe(companyData.logo);
      expect(response.body.data.banner).toBe(companyData.banner);
      expect(response.body.data.ceo.name).toBe('John Doe');

      dataTracker.trackCompany(response.body.data._id);
    });

    test('should create company with multiple industries', async () => {
      const { employer, token } = await createAuthenticatedEmployer(app);
      dataTracker.trackUser(employer._id);

      const companyData = await Factory('company')
        .with({ user: employer._id, industry: ['Technology', 'Finance', 'Healthcare'] })
        .build();

      const response = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${token}`)
        .send(companyData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.industry).toHaveLength(3);
      expect(response.body.data.industry).toEqual(['Technology', 'Finance', 'Healthcare']);

      dataTracker.trackCompany(response.body.data._id);
    });
  });

  // ─── Validation Failures ────────────────────────────────────────────────────

  describe('Validation Failures', () => {
    test('should fail without required fields', async () => {
      const { employer, token } = await createAuthenticatedEmployer(app);
      dataTracker.trackUser(employer._id);

      // Intentionally omit name, industry, location, description
      const response = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${token}`)
        .send({ user: employer._id });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.formattedMessage).toBeDefined();
    });

    test('should fail with invalid industry', async () => {
      const { employer, token } = await createAuthenticatedEmployer(app);
      dataTracker.trackUser(employer._id);

      const companyData = await Factory('company')
        .with({ user: employer._id, industry: ['InvalidIndustry'] })
        .build();

      const response = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${token}`)
        .send(companyData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.formattedMessage).toMatch(/industry/i);
    });

    test('should fail if employer tries to create a second company', async () => {
      const { employer, token } = await createAuthenticatedEmployer(app);
      dataTracker.trackUser(employer._id);

      const companyData = await Factory('company')
        .with({ user: employer._id, name: 'Unique Name' })
        .build();

      // First creation — precondition, result discarded
      await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${token}`)
        .send(companyData);

      // Second creation — this is what we're asserting on
      const response = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${token}`)
        .send(companyData);

      expect(response.status).toBe(409);
      expect(response.body.formattedMessage).toMatch(/only have one company/i);
    });

    test('should fail with duplicate company name', async () => {
      // Seed the first company directly — it's a precondition, not what we're testing
      const { employer: employer1, company } = await seedEmployerWithCompany(User, Company);
      dataTracker.trackUser(employer1._id);
      dataTracker.trackCompany(company._id);

      // Second employer tries to register with the same name
      const { employer: employer2, token: token2 } = await createAuthenticatedEmployer(app);
      dataTracker.trackUser(employer2._id);

      const duplicateData = await Factory('company')
        .with({ user: employer2._id, name: company.name })
        .build();

      const response = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${token2}`)
        .send(duplicateData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.formattedMessage).toMatch(/already exists/i);
    });
  });

  // ─── Authorization Failures ─────────────────────────────────────────────────

  describe('Authorization Failures', () => {
    test('should fail without authentication token', async () => {
      // .build() only — no auth needed, just a valid payload shape
      const companyData = await Factory('company')
        .with({ user: '507f1f77bcf86cd799439011' })
        .build();

      const response = await request(app)
        .post('/api/companies')
        .send(companyData);

      expect(response.status).toBe(401);
    });

    test('should fail with jobseeker role', async () => {
      // Default 'user' trait is already jobseeker — no trait needed
      const { user, token } = await createAuthenticatedUser(app);
      dataTracker.trackUser(user._id);

      const companyData = await Factory('company').with({ user: user._id }).build();

      const response = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${token}`)
        .send(companyData);

      expect(response.status).toBe(403);
      expect(response.body.formattedMessage).toMatch(/employer/i);
    });

    test('should fail with invalid token', async () => {
      const companyData = await Factory('company')
        .with({ user: '507f1f77bcf86cd799439011' })
        .build();

      const response = await request(app)
        .post('/api/companies')
        .set('Authorization', 'Bearer invalid.token.here')
        .send(companyData);

      expect(response.status).toBe(401);
    });
  });
});