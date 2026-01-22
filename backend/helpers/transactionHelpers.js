import mongoose from "mongoose"

/**
 * Executes a function inside a MongoDB transaction.
 *
 * Automatically starts a session, commits on success,
 * and aborts the transaction on error.
 *
 * @async
 * @function withTransaction
 * @param {function(mongoose.ClientSession): Promise<any>} callback
 *   Async function that receives the active mongoose session.
 *   All database operations inside this callback must pass `{ session }`.
 *
 * @returns {Promise<any>} The value returned by the callback.
 *
 * @throws Will rethrow any error that occurs inside the transaction.
 *
 * @example
 * // Example: Create a resume and update the user atomically
 * await withTransaction(async (session) => {
 *   const resume = await Resume.create(
 *     [{ user: userId, firstName: 'John', lastName: 'Doe' }],
 *     { session }
 *   );
 *
 *   await User.findByIdAndUpdate(
 *     userId,
 *     { $push: { resumes: resume[0]._id } },
 *     { session }
 *   );
 *
 *   return resume[0];
 * });
 */
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

export const hasSignificantChange = (updateData) => {
    const embeddingFields = ['skills', 'workExperience', 'certifications'];
    return embeddingFields.some(field => field in updateData);
}

export const hasScoreableChange = (updateData) => {
    const scoreableFields = [
        'firstName', 'lastName', 'address', 'phone', 
        'summary', 'skills', 'workExperience', 
        'certifications', 'socialMedia'
    ];
    return scoreableFields.some(field => field in updateData);
}