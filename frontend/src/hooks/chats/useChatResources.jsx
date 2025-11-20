import { useCallback, useEffect, useReducer, useState } from "react";
import { useData } from "../../contexts/DataProvider"
import axios from "axios";

const initialState = {
    pinnedMessages: {
        data: [],
        count: 0,
        loading: false,
        error: null,
        lastFetched: null,
        conversationId: null,
        fetched: false,
    },
    attachments: {
        data: [],
        count: 0,
        loading: false,
        error: null,
        lastFetched: null,
        conversationId: null,
        fetched: false,
    },
    links: {
        data: [],
        count: 0,
        loading: false,
        error: null,
        lastFetched: null,
        conversationId: null,
        fetched: false,
    },
    scheduledEvents: {
        data: [],
        count: 0,
        loading: false,
        error: null,
        lastFetched: null,
        conversationId: null,
        fetched: false,
    }
}

const resourcesReducer = (state, action) => {
    const { resourceType, payload } = action;

    switch (action.type) {
        case 'FETCH_START':
            return {
                ...state,
                [resourceType]: {
                    ...state[resourceType],
                    loading: true,
                    error: null,
                }
            };

        case 'FETCH_COUNTS_SUCCESS':
            return {
                ...state,
                [resourceType]: {
                    ...state[resourceType],
                    loading: false,
                    error: null,
                    count: payload.count,
                    lastFetched: Date.now(),
                    conversationId: action.conversationId
                }
            }

        case 'FETCH_DATA_SUCCESS':
            return {
                ...state,
                [resourceType]: {
                    ...state[resourceType],
                    loading: false,
                    error: null,
                    data: payload,
                    count: payload.length,
                    lastFetched: Date.now(),
                    conversationId: action.conversationId
                }
            };

        case 'FETCH_ERROR':
            return {
                ...state,
                [resourceType]: {
                    ...state[resourceType],
                    loading: false, 
                    error: payload
                }
            }

        case 'RESET':
            return initialState;
        
        default:
            return state
    }
}

export const useChatResources = ( conversation ) => {
    const { baseUrl } = useData();
    const [resources, dispatch] = useReducer(resourcesReducer, initialState);

    // Only fetch resource counts initially since not all resources are displayed to the user upon opening conversation yet.
    const fetchResourceCounts = useCallback(async (resourceType, endPoint, signal) => {
        dispatch({ type: 'FETCH_START', resourceType })

        try {
            const response = await axios.get(
                `${baseUrl}/conversations/${conversation?._id}/resources/${endPoint}/count`,
                { signal }
            );

            dispatch({
                type: 'FETCH_COUNTS_SUCCESS',
                resourceType,
                payload: response.data.data,
                conversationId: conversation._id
            })
        } catch (error) {
            if (error.name === 'CanceledError') return; // ✅ Ignore cancelled requests

            console.error(`Error fetching counts for ${resourceType}: `, error)
            dispatch({
                type: 'FETCH_ERROR',
                resourceType,
                payload: error.message
            })
        }
    }, [baseUrl, conversation?._id])

    const fetchResourceType = useCallback(async (resourceType, endPoint, signal) => {
        dispatch({ type: 'FETCH_START', resourceType})

        try {
            const response = await axios.get(
                `${baseUrl}/conversations/${conversation?._id}/resources/${endPoint}`,
                { signal }
            );
            dispatch({
                type: 'FETCH_DATA_SUCCESS',
                resourceType,
                payload: response.data.data,
                conversationId: conversation._id
            })
        } catch (error) {
            if (error.name === 'CanceledError') return; // ✅ Ignore cancelled requests

            console.error(`Error fetching ${resourceType}: `, error);
            dispatch({
                type: 'FETCH_ERROR',
                resourceType,
                payload: error.message
            })
        }
    }, [baseUrl, conversation?._id])

    // Fetch all resource counts when conversation changes
    useEffect(() => {
        if (!conversation?._id) {
            dispatch({ type: 'RESET' })
            return;
        }

        const abortController = new AbortController(); // ✅ Create controller

        const fetchAllCounts = async () => {
            const resourceTypes = [
                { type: 'pinnedMessages', endPoint: 'pinned-messages' },
                { type: 'attachments', endPoint: 'attachments' },
            ]

            await Promise.allSettled(
                resourceTypes.map(({ type, endPoint }) => 
                    fetchResourceCounts(type, endPoint, abortController.signal)
                )
            );
        };

        fetchAllCounts();

        return () => abortController.abort();  // ✅ Cancel on unmount/conversation change
    }, [conversation?._id, fetchResourceCounts])

    return { resources, fetchResourceType }
}