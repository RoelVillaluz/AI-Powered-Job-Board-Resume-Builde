import { Pinecone } from "@pinecone-database/pinecone";
import logger from "../utils/logger.js";

let pineconeIndex: ReturnType<Pinecone['index']>;

export const connectPinecone = async () => {
    try {
        const apiKey = process.env.PINECONE_API_KEY;
        const indexName = process.env.PINECONE_INDEX;

        if (!apiKey) {
            throw new Error('PINECONE_API_KEY is not defined in environment variables');
        }

        if (!indexName) {
            throw new Error('PINECONE_INDEX is not defined in environment variables');
        }

        const pc = new Pinecone({ apiKey });
        pineconeIndex = pc.index(indexName);

        const stats = await pineconeIndex.describeIndexStats();
        const namespaceList = Object.keys(stats.namespaces ?? {}).join(', ') || 'none';

        logger.info(`✅ Pinecone Connected: ${indexName}`);
        logger.info(`📊 Total vectors: ${stats.totalRecordCount ?? 0}`);
        logger.info(`🗂️  Namespaces: ${namespaceList}`);
    } catch (error: any) {
        logger.error(`❌ Pinecone Connection Error: ${error.message}`, { stack: error.stack });
        process.exit(1);
    }
}

export const getPineconeIndex = () => {
    if (!pineconeIndex) {
        throw new Error('Pinecone not initialized. Call connectPinecone() before using getPineconeIndex().');
    }
    return pineconeIndex;
};