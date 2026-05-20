import { Pinecone } from "@pinecone-database/pinecone";

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });

export const getPinecondeIndex = () => {
    return pc.index(process.env.PINECONE_INDEX!);
}