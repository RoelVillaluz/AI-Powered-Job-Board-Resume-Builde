import express from "express";
import path from "path";
import { fileURLToPath } from "url";

export const setupStaticAssets = (app) => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  app.use("/profile-pictures", express.static(path.join(__dirname, "../public/profile_pictures")));
  app.use("/company-logos", express.static(path.join(__dirname, "../public/company_logos")));
  app.use("/company_banners", express.static(path.join(__dirname, "../public/company_banners")));
  app.use("/company_images", express.static(path.join(__dirname, "../public/company_images")));
  app.use("/message-attachments", express.static(path.join(__dirname, "../public/message_attachments")));
};