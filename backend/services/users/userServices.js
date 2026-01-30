import { findConnectionRecommendations } from "../../repositories/users/userGetRepos.js"
import { transformProfilePictureUrl } from "../transformers/urlTransformers.js"

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