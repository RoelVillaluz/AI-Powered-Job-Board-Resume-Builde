export const updateResourceState = (state, conversationId, resourceType, updates) => {
    return {
        ...state,
        [conversationId]: {
            ...state[conversationId],
            [resourceType]: {
                ...state[conversationId]?.[resourceType],
                ...updates
            }
        }
    };
};