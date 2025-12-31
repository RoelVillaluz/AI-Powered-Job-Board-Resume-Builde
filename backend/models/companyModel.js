import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        unique: true,
        required: true
    },
    industry: {
        type: [String],
        required: true,
        enum: [
            "Technology",
            "Marketing",
            "Healthcare",
            "Finance",
            "Education",
            "Retail",
            "Manufacturing",
            "Media",
            "Entertainment",
            "Energy",
            "Travel",
            "Government",
        ]
    },
    location: {
        type: String,
        required: true
    },
    website: {
        type: String
    },
    size: {
        type: Number,
    },
    description: {
        type: String,
        required: true
    },
    logo: {
        type: String
    },
    jobs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "JobPosting"
    }],
    rating: {
        type: Number,
        default: 0.0,
    },
    banner: {
        type: String
    },
    images: {
        type: [String]
    },
    ceo: {
        name: {
            type: String
        },
        image: {
            type: String
        }
    }
}, { timestamps: true })

// ============================================
// PERFORMANCE INDEXES
// ============================================

// 1. PRIMARY INDEX: List companies by creation date (newest first)
// Supports:
// - Default company listings
// - Admin dashboards
// - Infinite scroll / pagination
companySchema.index({ createdAt: -1 })

// 2. OWNERSHIP INDEX: Fetch companies owned by a specific user
// Supports:
// - User dashboard (My Companies)
// - Authorization checks
companySchema.index({ user: 1 })

// 3. RANKING INDEX: Sort companies by rating
// Supports:
// - Top-rated companies
// - Recommendation sections
companySchema.index({ rating: -1 })

// 4. SIZE INDEX: Sort or filter companies by company size
// Supports:
// - "Largest companies" views
// - Size-based filtering
companySchema.index({ size: -1 })

// 5. FILTER + SORT INDEX: List companies by industry, newest first
// Supports:
// - Industry-specific listings
// - Filter by industry + sort by date
companySchema.index({ industry: 1, createdAt: -1 })

// 6. FILTER + SORT INDEX: Top-rated companies within an industry
// Supports:
// - "Best companies in Technology/Healthcare/etc."
// - Industry filter + rating sort
companySchema.index({ industry: 1, rating: -1 })

// 7. FILTER + SORT INDEX: Largest companies within an industry
// Supports:
// - Industry-based size comparisons
// - Filter by industry + sort by size
companySchema.index({ industry: 1, size: -1 })

// 8. GEO + CATEGORY INDEX: Filter companies by location and industry
// Supports:
// - Location-based searches (e.g. "Tech companies in Manila")
// - Combined geographic + industry filters
companySchema.index({ location: 1, industry: 1 })

// Middleware to delete related jobs when a company is deleted
companySchema.pre("deleteOne", { document: true, query: false }, async function (next) {
    await JobPosting.deleteMany({ _id: { $in: this.jobs } })
    next();
})


const Company = mongoose.model("Company", companySchema);
export default Company