const updateResourceState = (state, conversationId, resourceType, updates) => ({
    ...state,
    [conversationId]: {
        ...state[conversationId],
        [resourceType]: {
            ...(state[conversationId]?.[resourceType] || {}),
            ...updates
        }
    }
});
