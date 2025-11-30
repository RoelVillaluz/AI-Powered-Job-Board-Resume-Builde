import axios from "axios";

export const fetchResourceCounts = async (baseUrl, dispatch, resourcesRef, conversation, resourceType, endpoint, signal) => {
    if (!conversation?._id) return;

    const conversationId = conversation._id;
    
    // ✅ Get cached data for THIS conversation
    const conversationCache = resourcesRef.current[conversationId];
    const resource = conversationCache?.[resourceType] || {};
    
    const CACHE_TTL = 5 * 60 * 1000;

    // ✅ Check if cache is fresh
    const isCacheFresh = 
        resource.lastFetchedCounts &&
        Date.now() - resource.lastFetchedCounts < CACHE_TTL;

    if (isCacheFresh) {
        const age = Math.round((Date.now() - resource.lastFetchedCounts) / 1000);
        return;
    }

    dispatch({ 
        type: 'FETCH_START', 
        conversationId,
        resourceType 
    });

    try {
        const response = await axios.get(
            `${baseUrl}/conversations/${conversationId}/resources/${endpoint}/count`,
            { signal }
        );

        console.log(`✅ Fetched ${resourceType}:`, response.data.data);

        dispatch({
            type: 'FETCH_COUNTS_SUCCESS',
            conversationId,
            resourceType,
            payload: response.data.data
        });
    } catch (error) {
        if (error.name === 'CanceledError') {
            console.log(`❌ Cancelled ${resourceType}`);
            return;
        }

        console.error(`💥 Error fetching ${resourceType}:`, error);
        dispatch({
            type: 'FETCH_ERROR',
            conversationId,
            resourceType,
            payload: error.message
        });
    }
}

export const fetchResourceType = async (baseUrl, dispatch, resourcesRef, conversation, resourceType, endpoint, signal) => {
    if (!conversation?._id) return;

    const conversationId = conversation._id;

    const conversationCache = resourcesRef.current[conversationId];
    const resource = conversationCache?.[resourceType] || {};

    const CACHE_TTL = 5 * 60 * 1000;

    // ✅ Check if cache is fresh
    const isCacheFresh = 
        resource.lastFetchedDetails &&
        Date.now() - resource.lastFetchedDetails < CACHE_TTL;

    if (isCacheFresh) {
        const age = Math.round((Date.now() - resource.lastFetchedDetails) / 1000);
        console.log('Cached Resource fetched for: ', resource)
        return;
    }

    dispatch({ 
        type: 'FETCH_START', 
        conversationId,
        resourceType 
    });

    try {
        const response = await axios.get(
            `${baseUrl}/conversations/${conversationId}/resources/${endpoint}`,
            { signal }
        );

        console.log('Resource fetched: ', resourceType)

        dispatch({
            type: 'FETCH_DATA_SUCCESS',
            conversationId,
            resourceType,
            payload: response.data.data
        });
    } catch (error) {
        if (error.name === 'CanceledError') {
            console.log(`❌ Cancelled ${resourceType}`);
            return;
        }

        console.error(`Error fetching ${resourceType}:`, error);
        dispatch({
            type: 'FETCH_ERROR',
            conversationId,
            resourceType,
            payload: error.message
        });
    }
}