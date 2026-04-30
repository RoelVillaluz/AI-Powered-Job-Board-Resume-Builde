// src/types/express.d.ts
export {};

declare global {
    namespace Express {
        interface Request {
            user?: {
                id:    string;
                role?: string;
            };
            resumeDoc?: {
                _id:  string;
                user: string;
            };
        }
    }
}