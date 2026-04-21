import mongoose from "mongoose"
import logger from "../utils/logger.js";

export const connectDB = async () => {
    try {
        const env = process.env.NODE_ENV || "development";
        const mongoUri = process.env.MONGO_URI;

        // Safety check: Ensure MONGO_URI exists
        if (!mongoUri) {
            throw new Error("❌ MONGO_URI is not defined in environment variables");
        }

        // Safety check: In test environment, ensure URI contains "test"
        if (env === "test" && !mongoUri.includes("test")) {
            throw new Error('❌ Test environment must use a database with "test" in the name');
        }

        // Safety check: In production, warn if not using Atlas/cloud
        if (env === "production" && mongoUri.includes("localhost")) {
            logger.warn("⚠️ WARNING: Using localhost in production environment");
        }

        const conn = await mongoose.connect(mongoUri);

        logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
        logger.info(`📊 Database: ${conn.connection.name}`);
        logger.info(`🌍 Environment: ${env.toUpperCase()}`);

    } catch (error) {
        logger.error(`❌ MongoDB Connection Error: ${error.message}`, { stack: error.stack });
        process.exit(1);
    }
};

// Graceful shutdown
export const disconnectDB = async () => {
    try {
        await mongoose.connection.close();
        logger.info('🔌 MongoDB connection closed');
    } catch (error) {
        logger.error('❌ Error closing MongoDB connection', { stack: error.stack });
    }
};

// Handle process termination
process.on("SIGINT", async () => {
    await disconnectDB();
    process.exit(0);
});

process.on("SIGTERM", async () => {
    await disconnectDB();
    process.exit(0);
});