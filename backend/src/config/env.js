import dotenv from "dotenv";
import { existsSync } from "fs";
import path from "path";

const env =
    process.env.NODE_ENV === "production"
        ? ".env.production"
        : process.env.NODE_ENV === "test"
        ? ".env.test"
        : ".env.dev";

const envPath = path.resolve(process.cwd(), env);

if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
}