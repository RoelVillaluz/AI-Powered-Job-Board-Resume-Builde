import { useCallback, useEffect, useReducer, useRef } from "react";
import { useData } from "../../contexts/DataProvider"
import { RESOURCE_TYPES } from "../../../../shared/constants/chats/chatResourceTypes";
import { fetchResourceCounts, fetchResourceType } from "../../utils/chats/chatResourceUtils";
import { initialState, chatResourcesReducer } from "../../reducers/chats/chatResourcesReducer";

export const useChatResources = (conversation) => {
    const { baseUrl } = useData();
    const [resources, dispatch] = useReducer(chatResourcesReducer, initialState);

    const resourcesRef = useRef(resources);
    useEffect(() => {
        resourcesRef.current = resources;
    }, [resources]);

    // 🔥 Memoized version so it never changes
    const memoizedFetchCounts = useCallback(
        (resourceType, endpoint, signal) => {
            return fetchResourceCounts(
                baseUrl,
                dispatch,
                resourcesRef,
                conversation,
                resourceType,
                endpoint,
                signal
            );
        },
        [baseUrl, conversation?._id]
    );

    const memoizedFetchData = useCallback(
        (resourceType, endpoint, signal) => {
            return fetchResourceType(
                baseUrl,
                dispatch,
                conversation,
                resourceType,
                endpoint,
                signal
            );
        },
        [baseUrl, conversation?._id]
    );

    useEffect(() => {
        if (!conversation?._id) return;
        const abortController = new AbortController();

        const fetchAllCounts = async () => {
            await Promise.allSettled(
                RESOURCE_TYPES.map(({ type, endpoint }) =>
                    memoizedFetchCounts(type, endpoint, abortController.signal)
                )
            );
        };

        fetchAllCounts();
        return () => abortController.abort();

    }, [conversation?._id, memoizedFetchCounts]);

    const currentResources = resources[conversation?._id] || {
        pinnedMessages: { data: [], count: 0 },
        attachments: { data: [], count: 0 },
        links: { data: [], count: 0 },
        scheduledEvents: { data: [], count: 0 }
    };

    return { 
        resources: currentResources,
        fetchResourceType: memoizedFetchData
    };
};
