import dotenv from "dotenv";
import { existsSync } from "fs";

const envFile = process.env.NODE_ENV === "production"
    ? ".env.production"
    : process.env.NODE_ENV === "test"
        ? ".env.test"
        : ".env.dev";

if (existsSync(envFile)) {
    dotenv.config({ path: envFile });
}