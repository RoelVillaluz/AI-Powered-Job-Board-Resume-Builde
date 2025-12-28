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

  // Simulate login to get token
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: userData.email,
      password: userData.password // Use plain password for login
    });

  return {
    user,
    token: loginRes.body.token,
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

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: employerData.email,
      password: employerData.password
    });

  return {
    employer,
    token: loginRes.body.token,
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