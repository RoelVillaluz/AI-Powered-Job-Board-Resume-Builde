// models/jobPostingModel.js
import mongoose from "mongoose";

const jobPostingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: true
    },
    location: {
        type: String,
        required: true
    },
    jobType: {
        type: String,
        enum: ['Full-Time', 'Part-Time', 'Contract', 'Internship'],
        required: true
    },
    experienceLevel: {
        type: String,
        enum: ['Intern', 'Entry', 'Mid-Level', 'Senior'],
        required: false,
    },  
    salary: {
        currency: {
            type: String,
            enum: ['$', '₱', '€', '¥', '£'], 
            default: '$'
        },
        amount: {
            type: Number,
            default: null
        },
        frequency: {
            type: String,
            enum: ['hour', 'day', 'week', 'month', 'year'],
            default: 'year'
        }
    },    
    requirements: {
        type: [String],
        required: true
    },
    skills: [{
        name: { type: String, required: true }
    }],  
    preScreeningQuestions: [{
        question: { type: String, required: true },
        required: { type: Boolean, default: false },
        default: {}
    }],
    applicants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    postedAt: {
        type: Date,
        default: Date.now
    }   
});

// ============================================
// PERFORMANCE INDEXES
// ============================================

// 1. PRIMARY INDEX: List jobs sorted by date (most common query)
// Supports: Default listing, newest first
jobPostingSchema.index({ postedAt: -1 });

// 2. COMPOUND INDEX: Filter by job type + date
// Supports: "Show me Full-Time jobs, newest first"
jobPostingSchema.index({ jobType: 1, postedAt: -1 });

// 3. COMPOUND INDEX: Filter by experience level + date
// Supports: "Show me Entry level jobs, newest first"
jobPostingSchema.index({ experienceLevel: 1, postedAt: -1 });

// 4. TEXT INDEX: Full-text search on title
// Supports: Search queries like "software engineer"
jobPostingSchema.index({ title: 'text', location: 'text' });

// 5. SKILLS INDEX: Filter by skill name
// Supports: "Jobs requiring JavaScript"
jobPostingSchema.index({ 'skills.name': 1 });

// 6. SALARY INDEX: Filter by salary range
// Supports: "Jobs paying $80k-$120k"
jobPostingSchema.index({ 'salary.amount': 1 });

// 7. COMPOUND INDEX: Company + date (for company job listings)
// Supports: "Show all jobs from Company X"
jobPostingSchema.index({ company: 1, postedAt: -1 });

// 8. LOCATION INDEX: Filter by location
// Supports: "Jobs in New York"
jobPostingSchema.index({ location: 1 });

// 9. COMPOUND INDEX: Multi-filter optimization
// Supports: Complex queries like "Full-Time, Entry level jobs in NYC"
jobPostingSchema.index({ 
    jobType: 1, 
    experienceLevel: 1, 
    location: 1, 
    postedAt: -1 
});

// ============================================
// INDEX MANAGEMENT NOTES
// ============================================
// - Indexes use ~15-20% of collection size in disk space
// - Each index slows down writes by ~5-10%
// - Monitor index usage with: db.jobPostings.aggregate([{$indexStats:{}}])
// - Drop unused indexes after analyzing production queries
// - For 100k jobs: Expect ~50-100MB total index size

const JobPosting = mongoose.model("JobPosting", jobPostingSchema);
export default JobPosting;