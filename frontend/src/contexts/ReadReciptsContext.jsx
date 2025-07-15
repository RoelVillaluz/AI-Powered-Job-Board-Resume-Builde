import { createContext, useContext, useCallback, useRef, useEffect } from 'react';
import { useIntersectionObserver } from "../hooks/chats/useIntersectionObserver"
import { useAuth } from './AuthProvider';
import { useData } from './DataProvider';
import { markMessagesAsSeen as markMessagesAsSeenAPI } from '../services/messageServices';

const ReadReceiptsContext = createContext();

export const ReadReceiptsProvider = ({ children }) => {
    const { user } = useAuth();
    const { baseUrl } = useData();
    const { visibleElements, observe, unobserve } = useIntersectionObserver();
    const pendingMessages = useRef(new Set());
    const timeoutRef = useRef();
    const processedMessages = useRef(new Set());

    const registerMessage = useCallback((element, messageId, message) => {
        if (message.sender !== user._id && 
            !message.seen && 
            !processedMessages.current.has(messageId)) {
            observe(element, messageId);
        }
    }, [observe, user._id]);

    const markMessagesAsSeen = useCallback(async (messageIds) => {
        try {
            const messageIdsArray = Array.isArray(messageIds)
                                ? messageIds
                                : Array.from(messageIds)


            console.log('Message IDs Array: ',messageIdsArray)

            const response = await markMessagesAsSeenAPI(baseUrl, {
                messageIds: messageIdsArray,
                userId: user._id
            });

            if (response.status === 200) {
                messageIdsArray.forEach(id => {
                    processedMessages.current.add(id);
                });
            }
        } catch (error) {
            console.error('Error marking messages as seen:', error);
        }
    }, [baseUrl, user._id]);

    useEffect(() => {
        visibleElements.forEach(messageId => {
            if (!processedMessages.current.has(messageId)) {
                pendingMessages.current.add(messageId);
            }
        });

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            if (pendingMessages.current.size > 0) {
                markMessagesAsSeen(new Set(pendingMessages.current));
                pendingMessages.current.clear();
            }
        }, 1000);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [visibleElements, markMessagesAsSeen]);

    return (
        <ReadReceiptsContext.Provider value={{
            registerMessage,
            unobserve
        }}>
            {children}
        </ReadReceiptsContext.Provider>
    );
};

export const useReadReceipts = () => {
    const context = useContext(ReadReceiptsContext);
    if (!context) {
        throw new Error('useReadReceipts must be used within ReadReceiptsProvider');
    }
    return context;
};