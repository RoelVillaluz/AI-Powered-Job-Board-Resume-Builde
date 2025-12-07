import { updateResourceState } from "../../utils/chats/updateResourceStateUtil";

export const initialState = {};

export const chatResourcesReducer = (state, action) => {
    const { conversationId, resourceType, payload, append } = action;

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
            // ✅ Extract messages and pagination from payload
            const { messages, pagination } = payload;

            const existingData = append
                ? (state[conversationId]?.[resourceType]?.data || [])
                : [];

            return updateResourceState(state, conversationId, resourceType, {
                loadingDetails: false,
                error: null,
                data: append ? [...existingData, ...messages] : messages,
                count: pagination.totalItems,
                pagination: pagination,
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