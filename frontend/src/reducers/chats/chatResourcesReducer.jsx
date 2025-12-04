import { updateResourceState } from "../../utils/chats/updateResourceStateUtil";

export const initialState = {};

export const chatResourcesReducer = (state, action) => {
    const { conversationId, resourceType, payload } = action;

    switch (action.type) {
        case 'FETCH_START':
            return updateResourceState(state, conversationId, resourceType, {
                loading: true, // Change later to accept additional parameter to set loadingCounts or loadingDetails
                error: null,
            });

        case 'FETCH_COUNTS_SUCCESS':
            return updateResourceState(state, conversationId, resourceType, {
                loadingCounts: false,
                error: null,
                count: typeof payload === 'number' ? payload : payload.count,
                lastFetchedCounts: Date.now(),
            });

        case 'FETCH_DATA_SUCCESS':
            return updateResourceState(state, conversationId, resourceType, {
                loadingDetails: false,
                error: null,
                data: payload,
                count: payload.length,
                lastFetchedDetails: Date.now(),
                fetched: true,
            });

        case 'FETCH_ERROR':
            return updateResourceState(state, conversationId, resourceType, {
                loading: false,
                error: payload
            });

        case 'RESET':
            return {};

        default:
            return state;
    }
};