import express from "express";
import dotenv from "dotenv";
import cors from "cors"; 
import  userRoutes  from "./routes/userRoutes.js"
import { connectDB } from "./config/db.js";

dotenv.config();
const app = express();

app.use(cors()); 
app.use(express.json()); 

app.use('/api/users', userRoutes)

app.listen(5000, () => {
    connectDB();
    console.log("Server started at http://localhost:5000")
})