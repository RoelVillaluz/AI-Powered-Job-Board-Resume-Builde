// tests/integration/company/createCompany.test.js
import request from 'supertest';
import app from '../../../app.js';
import { connectTestDB, disconnectTestDB, TestDataTracker } from '../../helpers/db.js';
import { createAuthenticatedEmployer, createAuthenticatedUser } from '../../helpers/authHelper.js';
import { createTestCompany } from '../../helpers/testData.js';
import Company from '../../../models/companyModel.js';

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

  describe('Success Cases', () => {
    test('should create a company with valid employer credentials', async () => {
      // Arrange
      const { employer, token } = await createAuthenticatedEmployer(app);
      dataTracker.trackUser(employer._id);
      const companyData = createTestCompany(employer._id);

      // Act
      const response = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${token}`)
        .send(companyData);

      // Assert - Match your sendResponse structure
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.formattedMessage).toMatch(/Company created successfully/i);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.name).toBe(companyData.name);
      expect(response.body.data.industry).toEqual(companyData.industry);
      expect(response.body.data.location).toBe(companyData.location);
      expect(response.body.data.user.toString()).toBe(employer._id.toString());
      
      dataTracker.trackCompany(response.body.data._id);

      // Verify database
      const savedCompany = await Company.findById(response.body.data._id);
      expect(savedCompany).toBeTruthy();
      expect(savedCompany.name).toBe(companyData.name);
    });

    test('should create company with optional fields', async () => {
      const { employer, token } = await createAuthenticatedEmployer(app);
      dataTracker.trackUser(employer._id);

      const companyData = createTestCompany(employer._id, {
        logo: 'https://example.com/logo.png',
        banner: 'https://example.com/banner.png',
        images: ['https://example.com/img1.png', 'https://example.com/img2.png'],
        ceo: {
          name: 'John Doe',
          image: 'https://example.com/ceo.png'
        }
      });

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

      const companyData = createTestCompany(employer._id, {
        industry: ['Technology', 'Finance', 'Healthcare']
      });

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

  describe('Validation Failures', () => {
    test('should fail without required fields', async () => {
      const { employer, token } = await createAuthenticatedEmployer(app);
      dataTracker.trackUser(employer._id);

      const invalidData = {
        user: employer._id // Missing: name, industry, location, description
      };

      const response = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.formattedMessage).toBeDefined();
    });

    test('should fail with invalid industry', async () => {
      const { employer, token } = await createAuthenticatedEmployer(app);
      dataTracker.trackUser(employer._id);

      const companyData = createTestCompany(employer._id, {
        industry: ['InvalidIndustry']
      });

      const response = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${token}`)
        .send(companyData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.formattedMessage).toMatch(/industry/i);
    });

    test('should fail with duplicate company name', async () => {
      const { employer, token } = await createAuthenticatedEmployer(app);
      dataTracker.trackUser(employer._id);

      const companyData = createTestCompany(employer._id, {
        name: 'Unique Company Name'
      });

      // Create first company
      const firstResponse = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${token}`)
        .send(companyData);
      
      dataTracker.trackCompany(firstResponse.body.data._id);

      // Try to create duplicate
      const duplicateResponse = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${token}`)
        .send(companyData);

      expect(duplicateResponse.status).toBe(409);
      expect(duplicateResponse.body.success).toBe(false);
      expect(duplicateResponse.body.formattedMessage).toMatch(/already exists/i);
    });
  });

  describe('Authorization Failures', () => {
    test('should fail without authentication token', async () => {
      const companyData = createTestCompany('507f1f77bcf86cd799439011');

      const response = await request(app)
        .post('/api/companies')
        .send(companyData);

      expect(response.status).toBe(401);
    });

    test('should fail with jobseeker role', async () => {
      const { user, token } = await createAuthenticatedUser(app, { role: 'jobseeker' });
      dataTracker.trackUser(user._id);

      const companyData = createTestCompany(user._id);

      const response = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${token}`)
        .send(companyData);

      expect(response.status).toBe(403);
      expect(response.body.formattedMessage).toMatch(/employer/i);
    });

    test('should fail with invalid token', async () => {
      const companyData = createTestCompany('507f1f77bcf86cd799439011');

      const response = await request(app)
        .post('/api/companies')
        .set('Authorization', 'Bearer invalid.token.here')
        .send(companyData);

      expect(response.status).toBe(401);
    });
  });
});