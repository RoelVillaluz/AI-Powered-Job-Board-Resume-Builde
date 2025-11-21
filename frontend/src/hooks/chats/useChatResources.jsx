import { useCallback, useEffect, useReducer, useRef } from "react";
import { useData } from "../../contexts/DataProvider"
import axios from "axios";

const initialState = {}; // Empty object, we'll create conversations dynamically

const resourcesReducer = (state, action) => {
    const { conversationId, resourceType, payload } = action;

    switch (action.type) {
        case 'FETCH_START':
            return {
                ...state,
                [conversationId]: {
                    ...state[conversationId],
                    [resourceType]: {
                        ...(state[conversationId]?.[resourceType] || {}),
                        loading: true,
                        error: null,
                    }
                }
            };

        case 'FETCH_COUNTS_SUCCESS':
            return {
                ...state,
                [conversationId]: {
                    ...state[conversationId],
                    [resourceType]: {
                        ...(state[conversationId]?.[resourceType] || {}),
                        loading: false,
                        error: null,
                        count: payload.count,
                        lastFetched: Date.now(),
                    }
                }
            };

        case 'FETCH_DATA_SUCCESS':
            return {
                ...state,
                [conversationId]: {
                    ...state[conversationId],
                    [resourceType]: {
                        ...(state[conversationId]?.[resourceType] || {}),
                        loading: false,
                        error: null,
                        data: payload,
                        count: payload.length,
                        lastFetched: Date.now(),
                        fetched: true
                    }
                }
            };

        case 'FETCH_ERROR':
            return {
                ...state,
                [conversationId]: {
                    ...state[conversationId],
                    [resourceType]: {
                        ...(state[conversationId]?.[resourceType] || {}),
                        loading: false,
                        error: payload
                    }
                }
            };

        case 'RESET':
            return initialState;

        default:
            return state;
    }
};

export const useChatResources = (conversation) => {
    const { baseUrl } = useData();
    const [resources, dispatch] = useReducer(resourcesReducer, initialState);
    
    const resourcesRef = useRef(resources);
    
    useEffect(() => {
        resourcesRef.current = resources;
    }, [resources]);

    const fetchResourceCounts = useCallback(async (resourceType, endpoint, signal) => {
        if (!conversation?._id) return;

        const conversationId = conversation._id;
        
        // ✅ Get cached data for THIS conversation
        const conversationCache = resourcesRef.current[conversationId];
        const resource = conversationCache?.[resourceType] || {};
        
        const CACHE_TTL = 5 * 60 * 1000;

        // ✅ Check if cache is fresh
        const isCacheFresh = 
            resource.lastFetched &&
            Date.now() - resource.lastFetched < CACHE_TTL;

        if (isCacheFresh) {
            const age = Math.round((Date.now() - resource.lastFetched) / 1000);
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
    }, [baseUrl, conversation?._id]);

    const fetchResourceType = useCallback(async (resourceType, endpoint, signal) => {
        if (!conversation?._id) return;

        const conversationId = conversation._id;

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

            dispatch({
                type: 'FETCH_DATA_SUCCESS',
                conversationId,
                resourceType,
                payload: response.data.data
            });
        } catch (error) {
            if (error.name === 'CanceledError') return;

            console.error(`Error fetching ${resourceType}:`, error);
            dispatch({
                type: 'FETCH_ERROR',
                conversationId,
                resourceType,
                payload: error.message
            });
        }
    }, [baseUrl, conversation?._id]);

    useEffect(() => {
        if (!conversation?._id) {
            return;
        }

        const abortController = new AbortController();

        const fetchAllCounts = async () => {
            const resourceTypes = [
                { type: 'pinnedMessages', endpoint: 'pinned-messages' },
                { type: 'attachments', endpoint: 'attachments' },
                { type: 'links', endpoint: 'links' },
            ];

            await Promise.allSettled(
                resourceTypes.map(({ type, endpoint }) => 
                    fetchResourceCounts(type, endpoint, abortController.signal)
                )
            );
        };

        fetchAllCounts();

        return () => abortController.abort();
    }, [conversation?._id, fetchResourceCounts]);

    // ✅ Return resources for current conversation
    const currentResources = resources[conversation?._id] || {
        pinnedMessages: { data: [], count: 0, loading: false, error: null },
        attachments: { data: [], count: 0, loading: false, error: null },
        links: { data: [], count: 0, loading: false, error: null },
        scheduledEvents: { data: [], count: 0, loading: false, error: null }
    };

    return { resources: currentResources, fetchResourceType };
};