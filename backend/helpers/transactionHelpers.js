import mongoose from "mongoose"

export const withTransaction = async (callback) => {
    const session = await mongoose.startSession();
    
    try {
        await session.startTransaction();
        const result = await callback(session);
        await session.commitTransaction();
        return result;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};