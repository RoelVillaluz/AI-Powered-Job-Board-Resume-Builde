import crypto from "crypto";

export const createEmbeddingChecksum = (
    input: string,
): string => {
    return crypto
        .createHash("sha256")
        .update(input)
        .digest("hex");
};