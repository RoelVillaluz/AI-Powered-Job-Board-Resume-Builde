import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { readFileSync, writeFileSync } from 'fs';

dotenv.config({ path: '.env.k6' });

await mongoose.connect(process.env.MONGO_URI);

// Check if k6 user already exists
const existing = await mongoose.connection.collection('users').findOne({
    email: 'k6user@example.com',
});

let userId = existing?._id;

if (!existing) {
    const user = await mongoose.connection.collection('users').insertOne({
        email:      'k6user@example.com',
        firstName:  'K6',
        lastName:   'Test',
        password:   await bcrypt.hash('TestPassword123!', 10),
        role:       'jobseeker',
        isVerified: true,
        createdAt:  new Date(),
    });
    userId = user.insertedId;
    console.log('✅ K6 user created');
} else {
    console.log('ℹ️  K6 user already exists, skipping');
}

// Check if resume already exists for this user
const existingResume = await mongoose.connection.collection('resumes').findOne({
    user: userId,
});

let resumeId = existingResume?._id;

if (!existingResume) {
    const resume = await mongoose.connection.collection('resumes').insertOne({
        user:      userId,
        firstName: 'K6',
        lastName:  'Test',
        jobTitle:  { name: 'Full Stack Developer' },
        location:  { name: 'San Francisco, CA' },
        skills: [
            { name: 'JavaScript', level: 'Advanced' },
            { name: 'Node.js',    level: 'Intermediate' },
            { name: 'MongoDB',    level: 'Intermediate' },
        ],
        workExperience: [
            {
                jobTitle:  'Junior Developer',
                company:   'Previous Corp',
                startDate: new Date('2021-01-01'),
                endDate:   new Date('2023-01-01'),
            },
        ],
        certifications: [
            { name: 'AWS Certified Developer', year: '2022' },
        ],
        createdAt: new Date(),
    });
    resumeId = resume.insertedId;
    console.log('✅ K6 resume created');
} else {
    console.log('ℹ️  K6 resume already exists, skipping');
}

// Write RESUME_ID back into .env.k6 automatically
const envPath = '.env.k6';
const envContent = readFileSync(envPath, 'utf-8');
const updated = envContent.replace(
    /^RESUME_ID=.*$/m,
    `RESUME_ID=${resumeId}`,
);
writeFileSync(envPath, updated);

console.log(`✅ K6 seed complete — RESUME_ID=${resumeId} written to .env.k6`);

await mongoose.disconnect();