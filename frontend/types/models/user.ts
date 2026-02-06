export type UserRole = 'jobseeker' | 'employer';

export interface User {
    _id?: string;
    id?: string;
    email: string;
    firstName: string;
    lastName: string;
    password?: string; // Shouldn't be exposed to frontend
    role?: UserRole;
    profilePicture?: string;
    isVerified?: boolean;
    verificationCode?: string;
    
    // Role-specific fields
    company?: string; // ObjectId - only for employers
    resumes?: string[]; // ObjectId[] - only for jobseekers
    savedJobs?: string[]; // ObjectId[] - only for jobseekers
    appliedJobs?: string[]; // ObjectId[] - only for jobseekers
    
    // Other fields (add as needed)
    streakCount?: number;
    loggedInDates?: string[];
    createdAt?: Date | string;
    
    // Virtual
    fullName?: string;
}