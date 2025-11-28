import { updateResourceState } from "../../utils/chats/updateResourceStateUtil";

export const initialState = {};

export const chatResourcesReducer = (state, action) => {
    const { conversationId, resourceType, payload } = action;

    switch (action.type) {
        case 'FETCH_START':
            return updateResourceState(state, conversationId, resourceType, {
                loading: true,
                error: null,
            });

        case 'FETCH_COUNTS_SUCCESS':
            return updateResourceState(state, conversationId, resourceType, {
                loading: false,
                error: null,
                count: payload.count,
                lastFetched: Date.now(),
            });

        case 'FETCH_DATA_SUCCESS':
            return updateResourceState(state, conversationId, resourceType, {
                loading: false,
                error: null,
                data: payload,
                count: payload.length,
                lastFetched: Date.now(),
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