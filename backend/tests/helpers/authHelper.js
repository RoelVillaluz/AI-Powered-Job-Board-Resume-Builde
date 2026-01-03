import request from 'supertest';
import User from '../../models/userModel.js';
import { createTestUser, createTestEmployer, hashPassword } from './testData.js';

/**
 * Creates and authenticates a test user, returns token and user
 */
export const createAuthenticatedUser = async (app, userOverrides = {}) => {
  const userData = createTestUser(userOverrides);
  
  // Hash password before saving to DB
  const hashedPassword = await hashPassword(userData.password);
  
  const user = await User.create({
    ...userData,
    password: hashedPassword
  });

  console.log('Created user for login:', { email: userData.email, role: user.role });

  // Simulate login to get token
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: userData.email,
      password: userData.password // Use plain password for login
    });

  console.log('Login status:', loginRes.status);
  console.log('Login response body:', JSON.stringify(loginRes.body, null, 2));

  // Your login response structure: { success, formattedMessage, data: { token, user } }
  if (!loginRes.body.data || !loginRes.body.data.token) {
    console.error('❌ Login failed - Full response:', loginRes.body);
    throw new Error(`Failed to get authentication token from login response. Status: ${loginRes.status}`);
  }

  return {
    user,
    token: loginRes.body.data.token,
    plainPassword: userData.password
  };
};

/**
 * Creates and authenticates an employer with company
 */
export const createAuthenticatedEmployer = async (app, employerOverrides = {}) => {
  const employerData = createTestEmployer(employerOverrides);
  
  const hashedPassword = await hashPassword(employerData.password);
  
  const employer = await User.create({
    ...employerData,
    password: hashedPassword
  });

  console.log('Created employer for login:', { email: employerData.email, role: employer.role });

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: employerData.email,
      password: employerData.password
    });

  console.log('Login status:', loginRes.status);
  console.log('Login response body:', JSON.stringify(loginRes.body, null, 2));

  // Your login response structure: { success, formattedMessage, data: { token, user } }
  if (!loginRes.body.data || !loginRes.body.data.token) {
    console.error('❌ Login failed - Full response:', loginRes.body);
    throw new Error(`Failed to get authentication token from login response. Status: ${loginRes.status}`);
  }

  return {
    employer,
    token: loginRes.body.data.token,
    plainPassword: employerData.password
  };
};

/**
 * Helper to make authenticated requests
 */
export const authenticatedRequest = (app, method, url, token) => {
  return request(app)[method](url)
    .set('Authorization', `Bearer ${token}`);
};