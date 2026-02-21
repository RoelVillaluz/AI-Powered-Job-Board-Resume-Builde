import { withTransaction } from "../../helpers/transactionHelpers.js"
import { createCompany } from "../../repositories/company/companyRepositories.js"
import { findConnectionRecommendations } from "../../repositories/users/userGetRepos.js"
import { createResumeService } from "../resumes/resumeServices.js"
import { transformProfilePictureUrl } from "../transformers/urlTransformers.js"
import User from "../../models/userModel.js"
import { NotFoundError } from "../../middleware/errorHandler.js"

/**
 * Fetches connection recommendations for a given user and transforms their profile pictures.
 *
 * This service:
 * 1. Retrieves users who are not yet connected to the given user.
 * 2. Transforms their profilePicture URLs for consistent display.
 *
 * @param {string} id - The ID of the user for whom to fetch connection recommendations.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of recommended users,
 * each with the original user fields plus a transformed `profilePicture` URL.
 *
 * @example
 * const recommendations = await getConnectionRecommendationService('64a1f2c...');
 * console.log(recommendations[0].profilePicture); // transformed URL
 */
export const getConnectionRecommendationService = async (id) => {
    const recommendations = await findConnectionRecommendations(id)

    const result = recommendations.map(user => ({
        ...user,
        profilePicture: transformProfilePictureUrl(user.profilePicture)
    }))

    return result
}

/**
 * Onboarding service for the "Get Started Form" that updates user's role and creates either resume/company
 * @param {string} userId - user ID of account being setup
 * @param {string} userRole - jobseeker or employer
 * @param {Object} onboardingData - creates either resume/company
 */
export const completeUserOnboardingService = async ({ userId, userRole, onboardingData }) => {
    return await withTransaction(async (session) => {
        // 1️⃣ Load user inside transaction
        const user = await User.findById(userId).session(session);
        if (!user) {
            throw new NotFoundError('User');
        }

        // 2️⃣ Set role
        user.role = userRole;

        if (userRole === 'jobseeker') {
            console.log('Creating resume with data:', {
                user: user._id,
                ...onboardingData,
            });

            const { resume } = await createResumeService({
                user: user._id,
                ...onboardingData,
            }, { session });

            user.resumes = [resume._id];
        }

        if (userRole === 'employer') {
            const newCompany = await createCompany({
                user: user._id,
                ...onboardingData
            }, { session });

            user.company = newCompany._id;
        }

        // 3️⃣ Finalize onboarding
        user.isOnboardingComplete = true;
        await user.save({ session });

        return user;
    });
};
