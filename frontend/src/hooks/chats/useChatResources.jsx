import { useCallback, useEffect, useReducer, useState } from "react";
import { useData } from "../../contexts/DataProvider"
import axios from "axios";

const initialState = {
    pinnedMessages: {
        data: [],
        count: 0,
        loading: false,
        error: null
    },
    attachments: {
        data: [],
        count: 0,
        loading: false,
        error: null
    },
    links: {
        data: [],
        count: 0,
        loading: false,
        error: null
    },
    scheduledEvents: {
        data: [],
        count: 0,
        loading: false,
        error: null
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
                    error: null
                }
            };

        case 'FETCH_SUCCESS':
            return {
                ...state,
                [resourceType]: {
                    ...state[resourceType],
                    loading: false,
                    error: null,
                    data: payload,
                    count: payload.length
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

    // Dynamic fetch resource function
    const fetchResource = useCallback(async (resourceType, endPoint) => {
        dispatch({ type: 'FETCH_START', resourceType })

        try {
            const response = await axios.get(`${baseUrl}/conversations/${conversation?._id}/resources/${endPoint}`);
            dispatch({ 
                type: 'FETCH_SUCCESS',
                resourceType,
                payload: response.data.data
            })
        } catch (error) {
            console.error(`Error fetching ${resourceType}: `, error)
            dispatch({
                type: 'FETCH_ERROR',
                resourceType,
                payload: error.message
            })
        }
    }, [baseUrl, conversation?._id])

    // Fetch all resources when conversation changes
    useEffect(() => {
        if (!conversation?._id) {
            dispatch({ type: 'RESET' })
            return;
        }
        
        fetchResource('pinnedMessages', 'pinned-messages')
        fetchResource('attachments', 'attachments')
    }, [conversation?._id, fetchResource])

    return { resources }
}