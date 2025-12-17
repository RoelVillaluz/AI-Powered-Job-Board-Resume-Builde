import userRoutes from "./userRoutes.js";
import jobPostingRoutes from "./jobPostingRoutes.js";
import resumeRoutes from "./resumeRoutes.js";
import companyRoutes from "./companyRoutes.js";
import aiRoutes from "./aiRoutes.js";
import applicationRoutes from "./applicationRoutes.js";

import {
  conversationRoutes,
  attachmentRoutes,
  linkRoutes,
  messageRoutes,
  pinnedMessageRoutes
} from "./chat/index.js";

export const registerRoutes = (app) => {
  // Core API
  app.use("/api/users", userRoutes);
  app.use("/api/job-postings", jobPostingRoutes);
  app.use("/api/resumes", resumeRoutes);
  app.use("/api/companies", companyRoutes);
  app.use("/api/ai", aiRoutes);
  app.use("/api/applications", applicationRoutes);

  // Chat
  app.use("/api/messages", messageRoutes);
  app.use("/api/conversations", conversationRoutes);
  app.use("/api/conversations/:conversationId/resources/attachments", attachmentRoutes);
  app.use("/api/conversations/:conversationId/resources/pinned-messages", pinnedMessageRoutes);
  app.use("/api/conversations/:conversationId/resources/links", linkRoutes);
};