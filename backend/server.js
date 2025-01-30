import express from "express";
import dotenv from "dotenv";
import cors from "cors"; 
import  userRoutes  from "./routes/userRoutes.js"
import jobPostingRoutes from "./routes/jobPostingRoutes.js"
import resumeRoutes from "./routes/resumeRoutes.js"

import { connectDB } from "./config/db.js";

dotenv.config();
const app = express();

app.use(cors()); 
app.use(express.json()); 

app.use('/api/users', userRoutes)
app.use('/api/job_postings', jobPostingRoutes)
app.use('/api/resumes', resumeRoutes)

app.listen(5000, () => {
    connectDB();
    console.log("Server started at http://localhost:5000")
})