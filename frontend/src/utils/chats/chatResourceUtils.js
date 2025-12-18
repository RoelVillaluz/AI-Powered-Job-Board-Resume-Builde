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
        const token = localStorage.getItem('authToken'); 
        const response = await axios.get(
            `${baseUrl}/conversations/${conversationId}/resources/${endpoint}/count`,
            {
                signal,
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
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

export const fetchResourceType = async (
        baseUrl, 
        dispatch, 
        resourcesRef, 
        conversation, 
        resourceType,
        endpoint, 
        signal, 
        setCurrentResource, 
        setMessagesWithCurrentResource,
        page = 1,
        limit = 5
    ) => {
    if (!conversation?._id) return;

    const conversationId = conversation._id;

    const conversationCache = resourcesRef.current[conversationId];
    const resource = conversationCache?.[resourceType] || {};

    const CACHE_TTL = 5 * 60 * 1000;

    // ✅ Check if cache is fresh and only use for first page
    const isCacheFresh = 
        page === 1 &&
        resource.lastFetchedDetails &&
        Date.now() - resource.lastFetchedDetails < CACHE_TTL;

    if (isCacheFresh) {
        console.log('✅ Using cached resource:', resource);

        setCurrentResource({
            conversationId: conversation._id,
            resourceKey: resourceType
        });

        setMessagesWithCurrentResource(resource.data || []);

        return;
    }


    dispatch({ 
        type: 'FETCH_START', 
        conversationId,
        resourceType 
    });

    try {
        const token = localStorage.getItem('authToken'); 
        const response = await axios.get(
            `${baseUrl}/conversations/${conversationId}/resources/${endpoint}`,
            {
                signal,
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );


        // ✅ Extract messages and pagination from nested response
        const { messages, pagination } = response.data.data;

        dispatch({
            type: 'FETCH_DATA_SUCCESS',
            conversationId,
            resourceType,
            payload: {
                messages,      // ✅ Array of messages
                pagination     // ✅ Pagination metadata
            },
            append: page > 1  // ✅ Flag to append or replace data
        });

        setCurrentResource({
            conversationId: conversation._id,
            resourceKey: resourceType
        })
        
        if (page > 1) {
            setMessagesWithCurrentResource(prev => [...prev, ...messages]);
        } else {
            setMessagesWithCurrentResource(messages)
        }
        
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