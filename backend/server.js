import express from "express";
import dotenv from "dotenv";
import cors from "cors"; 
import userRoutes  from "./routes/userRoutes.js"
import jobPostingRoutes from "./routes/jobPostingRoutes.js"
import resumeRoutes from "./routes/resumeRoutes.js"
import companyRoutes from "./routes/companyRoutes.js"
import aiRoutes from './routes/aiRoutes.js'
import path from 'path';
import { connectDB } from "./config/db.js";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();

app.use(cors()); 
app.use(express.json()); 

// Get the current directory using import.meta.url
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Middleware to serve static files from the 'club icons' and 'player icons' directory
app.use('/profile-pictures', express.static(path.join(__dirname, 'public', 'profile_pictures')))
app.use('/company-logos', express.static(path.join(__dirname, 'public', 'company_logos')))

app.use('/api/users', userRoutes)
app.use('/api/job-postings', jobPostingRoutes)
app.use('/api/resumes', resumeRoutes)
app.use('/api/companies', companyRoutes)
app.use('/api/ai', aiRoutes)

app.listen(5000, () => {
    connectDB();
    console.log("Server started at http://localhost:5000")
})