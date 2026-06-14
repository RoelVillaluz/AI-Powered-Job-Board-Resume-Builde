import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { readFileSync, writeFileSync } from 'fs';
import jwt from 'jsonwebtoken';

dotenv.config({ path: '.env.k6' });

await mongoose.connect(process.env.MONGO_URI);

const resumes = await mongoose.connection
    .collection('resumes')
    .aggregate([
        { $match: { 'skills.0': { $exists: true } } },
        { $sample: { size: 10 } },
        { $lookup: {
            from:         'users',
            localField:   'user',
            foreignField: '_id',
            as:           'userDoc',
        }},
        { $unwind: '$userDoc' },
        { $match: { 'userDoc.isVerified': true, 'userDoc.role': 'jobseeker' } },
        { $project: { _id: 1, userId: '$userDoc._id' } },
    ]).toArray();

if (!resumes.length) {
    console.error('❌ No eligible resumes found in dev DB');
    process.exit(1);
}

console.log(`✅ Found ${resumes.length} resumes`);

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('❌ JWT_SECRET not set in .env.k6');
    process.exit(1);
}

const resumeIds = resumes.map(r => r._id.toString()).join(',');
const tokens    = resumes.map(r =>
    jwt.sign(
        { id: r.userId.toString(), role: 'jobseeker' },
        JWT_SECRET,
        { expiresIn: '1d' },
    )
).join(',');

resumes.forEach((r, i) => console.log(`  [${i}] resumeId=${r._id}`));

const envPath    = '.env.k6';
const envContent = readFileSync(envPath, 'utf-8');

const replace = (content, key, value) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    return regex.test(content)
        ? content.replace(regex, `${key}=${value}`)
        : content + `\n${key}=${value}`;
};

let updated = envContent;
updated = replace(updated, 'RESUME_IDS',  resumeIds);
updated = replace(updated, 'USER_TOKENS', tokens);

writeFileSync(envPath, updated);
console.log(`✅ Written ${resumes.length} resume IDs and tokens to .env.k6`);

await mongoose.disconnect();