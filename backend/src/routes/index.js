import userRoutes from "./users/userRoutes.js";
import jobPostingRoutes from "./jobPostingRoutes.js";
import resumeRoutes from "./resumes/resumeRoutes.js";
import resumeRoutesV2 from "./resumes/resumeRoutesV2.js";
import companyRoutes from "./companyRoutes.js";
import aiRoutes from "./aiRoutes.js";
import applicationRoutes from "./applicationRoutes.js";
import authRoutes from "./authRoutes.js";
import skillRoutes from './market/skills/skillRoutes.js';
import skillEmbeddingRoutes from './market/skills/skillEmbeddingRoutes.js';

import jobTitleRoutes from './market/jobTitle/jobTitleRoutes';
import jobTitleEmbeddingRoutes from './market/jobTitle/jobTitleEmbeddingRoutes';

import locationRoutes from './market/location/locationRoutes.js';
import locationEmbeddingRoutes from './market/location/locationEmbeddingRoutes.js';

import industryRoutes from './market/industry/industryRoutes';
import industryEmbeddingRoutes from './market/industry/industryEmbeddingRoutes';

// import healthRoutes from './health/healthRoutes.js'

import {
  conversationRoutes,
  attachmentRoutes,
  linkRoutes,
  messageRoutes,
  pinnedMessageRoutes
} from "./chat/index.js";

export const registerRoutes = (app) => {
  // Health
  // app.use("/api/health", healthRoutes);

  // Core API
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/job-postings", jobPostingRoutes);
  
  app.use("/api/companies", companyRoutes);
  app.use("/api/ai", aiRoutes);
  app.use("/api/applications", applicationRoutes);

  // Market
  app.use('/api/v2/job-titles', jobTitleEmbeddingRoutes);
  app.use('/api/job-titles', jobTitleRoutes);

  app.use('/api/v2/skills', skillEmbeddingRoutes);
  app.use('/api/skills', skillRoutes);

  app.use('/api/v2/locations', locationEmbeddingRoutes);
  app.use('/api/locations', locationRoutes);


  app.use('/api/v2/industries', industryEmbeddingRoutes);
  app.use('/api/industries', industryRoutes);

  // Chat
  app.use("/api/messages", messageRoutes);
  app.use("/api/conversations", conversationRoutes);
  app.use("/api/conversations/:conversationId/resources/attachments", attachmentRoutes);
  app.use("/api/conversations/:conversationId/resources/pinned-messages", pinnedMessageRoutes);
  app.use("/api/conversations/:conversationId/resources/links", linkRoutes);

  // Resumes
  app.use("/api/v2/resumes", resumeRoutesV2);
  app.use("/api/resumes", resumeRoutes);
};