import express from "express";
import dotenv from "dotenv";
import cors from "cors"; 
import userRoutes  from "./routes/userRoutes.js"
import jobPostingRoutes from "./routes/jobPostingRoutes.js"
import resumeRoutes from "./routes/resumeRoutes.js"
import companyRoutes from "./routes/companyRoutes.js"
import aiRoutes from './routes/aiRoutes.js'
import applicationRoutes from './routes/applicationRoutes.js'
import conversationRoutes from './routes/conversationRoutes.js'
import messageRoutes from './routes/messageRoutes.js'
import path from 'path';
import { connectDB } from "./config/db.js";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();
const app = express();

app.use(cors()); 
app.use(express.json()); 

// Get the current directory using import.meta.url
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use('/profile-pictures', express.static(path.join(__dirname, 'public', 'profile_pictures')))

app.use('/company-logos', express.static(path.join(__dirname, 'public', 'company_logos')))
app.use('/company_banners', express.static(path.join(__dirname, 'public', 'company_banners')))
app.use('/company_images', express.static(path.join(__dirname, 'public', 'company_images')))

app.use('/api/users', userRoutes)
app.use('/api/job-postings', jobPostingRoutes)
app.use('/api/resumes', resumeRoutes)
app.use('/api/companies', companyRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/conversations', conversationRoutes)
app.use('/api/messages', messageRoutes)

// Create HTTP server
const server = createServer(app)

// Initialize Socket.IO server and attach it to the HTTP server
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

// Socket.IO connection logic
io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join user's personal room
    socket.on("join-user-room", (userId) => {
        console.log(`User ${userId} joined their room`);
        socket.join(userId)
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });

    // Send message event
    socket.on('send-message', (message) => {
        console.log(`Message sent successfully from ${message.sender} to ${message.receiverId}`)

        // Emit to receiver's room
        io.to(message.receiverId).emit('new-message', message)

        // Optionally echo to sender's room as well
        io.to(message.sender._id).emit('new-message', message)
    });

    // Update message event
    socket.on('update-message', (updatedMessage) => {
        console.log('Message edited successfully: ', updatedMessage)

        // Emit to receiver's room
        io.to(updatedMessage.receiverId).emit('update-message', updatedMessage)
        
        // Optionally echo to sender's room as well
        io.to(updatedMessage.sender._id).emit('update-message', updatedMessage)
    })

    // Delete message event
    socket.on('delete-message', (deletedMessage) => {
        console.log('Message deleted successfully: ', deletedMessage)

        // Emit to receiver's room
        io.to(deletedMessage.receiverId).emit('delete-message', deletedMessage)
        
        // Optionally echo to sender's room as well
        io.to(deletedMessage.sender).emit('delete-message', deletedMessage)
    })
})

// Connect to DB before starting server
connectDB();

// Start server
server.listen(5000, () => {
    console.log("Server started at http://localhost:5000")
})

const deleteMessagesFromConvo = async () => {
    const allConvos = await Conversation.find({})

    for (const convo of allConvos) {
        
    }
}