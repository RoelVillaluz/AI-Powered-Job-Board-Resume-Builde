import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useData } from "../../contexts/DataProvider"
import { RESOURCE_TYPES } from "../../../../shared/constants/chats/chatResourceTypes";
import { fetchResourceCounts, fetchResourceType } from "../../utils/chats/chatResourceUtils";
import { initialState, chatResourcesReducer } from "../../reducers/chats/chatResourcesReducer";
import { getResourceState } from "../../../../shared/constants/chats/chatResourceTypes";

export const useChatResourceManager = (conversation) => {
    const { baseUrl } = useData();
    const [resources, dispatch] = useReducer(chatResourcesReducer, initialState);
    const [currentResource, setCurrentResource] = useState({
        conversationId: null,
        resourceKey: null
    });
    const [messagesWithCurrentResource, setMessagesWithCurrentResource] = useState([]);

    // Keep a live ref for caching
    const resourcesRef = useRef(resources);
    useEffect(() => {
        resourcesRef.current = resources;
    }, [resources]);

    // Abort controllers per resource type (for detail fetches)
    const abortControllers = useRef({});

    const fetchCounts = useCallback(
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

    const fetchResource = useCallback(
        (resourceType, endpoint) => {
            if (!conversation?._id) return;

            // Abort previous fetch for this resource type
            if (abortControllers.current[resourceType]) {
                abortControllers.current[resourceType].abort();
            }

            const controller = new AbortController();
            abortControllers.current[resourceType] = controller;

            console.log(`Messages with ${resourceType}: `, messagesWithCurrentResource)

            return fetchResourceType(
                baseUrl,
                dispatch,
                resourcesRef,
                conversation,
                resourceType,
                endpoint,
                controller.signal,
                setCurrentResource,
                setMessagesWithCurrentResource
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
                    fetchCounts(type, endpoint, abortController.signal)
                )
            );
        };

        fetchAllCounts();

        return () => abortController.abort();
    }, [conversation?._id, fetchCounts]);

    const currentResources = resources[conversation?._id] || getResourceState();

    return {
        resources: currentResources,

        currentResource,
        setCurrentResource,

        messagesWithCurrentResource,
        setMessagesWithCurrentResource,

        fetchCounts,       // can call manually if needed
        fetchResource      // fetch full details on-demand
    };
};