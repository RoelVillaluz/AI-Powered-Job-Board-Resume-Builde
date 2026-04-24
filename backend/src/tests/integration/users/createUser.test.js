import request from 'supertest';
import app from '../../../app.js';
import { connectTestDB, disconnectTestDB, TestDataTracker } from '../../helpers/db.js';
import { Factory } from '../../factories/index.js';
import bcrypt from 'bcrypt';
import User from '../../../models/UserModel.js';
import { TempUser } from '../../../models/tempUserModel.js'

describe('POST /api/users - create users', () => {
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
        test('should create temporary user', async () => {

            const registrationData = await Factory('tempUser').build();

            const response = await request(app)
                .post('/api/users')
                .send(registrationData)

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.formattedMessage).toMatch(/Verification code sent to email/i);

            expect(response.body.data.email).toBe(registrationData.email);
            expect(response.body.data.firstName).toBe(registrationData.firstName);
            expect(response.body.data.lastName).toBe(registrationData.lastName);
            
            const isMatch = await bcrypt.compare(
                registrationData.password,
                response.body.data.password
            );

            expect(isMatch).toBe(true);

            expect(response.body.data).toHaveProperty('verificationCode')
        });

        test('should create user after correct verification code input', async () => {
            const userData = await Factory('tempUser').for(TempUser).create();

            const verificationData = {
                email: userData.email,
                verificationType: 'register', 
                verificationCode: userData.verificationCode
            }

            const response = await request(app)
                .post('/api/auth/verify')
                .send(verificationData)

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.formattedMessage).toMatch(/User created successfully/i);
        })
    });

    describe('Validation failures', () => {
        test('should fail if email already exists', async () => {
            const user1Data = await Factory('user').for(User).create();
            const user2Data = await Factory('tempUser').with({ email: user1Data.email }).build();

            const response = await request(app)
                .post('/api/users')
                .send(user2Data);

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.formattedMessage).toMatch(/Email already exists/i);
        })

        test('should fail if temporary user with same email already exists', async () => {
            const user1Data = await Factory('tempUser').for(TempUser).create();
            const user2Data = await Factory('tempUser').with({ email: user1Data.email }).build();

            const response = await request(app)
                .post('/api/users')
                .send(user2Data);

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.formattedMessage).toMatch(/A verification email has already been sent to this email/i);
        })
    })
})