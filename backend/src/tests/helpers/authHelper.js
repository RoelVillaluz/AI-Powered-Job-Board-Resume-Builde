// authHelper.js — replace Factory usage with direct model creation
import request from 'supertest';
import User from '../../models/UserModel.js';
import bcrypt from 'bcrypt';

export const createAuthenticatedUser = async (app, overrides = {}, traits = []) => {
    const plainPassword = 'TestPassword123!';
    const role = traits.includes('employer') ? 'employer' : 'jobseeker';

    const userData = {
        email:      `test.${role}.${Date.now()}@example.com`,
        firstName:  'Test',
        lastName:   'User',
        password:   await bcrypt.hash(plainPassword, 10),
        role,
        isVerified: true,
        ...overrides,
    };

    const user = await User.create(userData);

    const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email, password: plainPassword });

    if (!loginRes.body.data?.token) {
        throw new Error(
            `createAuthenticatedUser: login failed.\nStatus: ${loginRes.status}\nBody: ${JSON.stringify(loginRes.body, null, 2)}`
        );
    }

    return { user, token: loginRes.body.data.token, plainPassword };
};

export const createAuthenticatedEmployer = async (app, overrides = {}) => {
    const { user: employer, token, plainPassword } = await createAuthenticatedUser(
        app, overrides, ['employer']
    );
    return { employer, token, plainPassword };
};

export const createAuthenticatedJobseeker = async (app, overrides = {}) => {
    const { user: jobseeker, token, plainPassword } = await createAuthenticatedUser(
        app, overrides, ['jobseeker']
    );
    return { jobseeker, token, plainPassword };
};

export const authenticatedRequest = (app, method, url, token) => {
    return request(app)[method](url).set('Authorization', `Bearer ${token}`);
};