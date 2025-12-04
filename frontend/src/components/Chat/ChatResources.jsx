import { useState, useEffect } from "react"
import { useChatResourceManager } from "../../hooks/chats/useChatResourceManager";
import ChatResourceItemList from "./chatResourceComponents/ChatResourceItemList";
import CurrentChatResourceDetail from "./chatResourceComponents/currentChatResourceDetail";

function ChatResources({ currentConversation }) {
    const { resources, currentResource, setCurrentResource, messagesWithCurrentResource, fetchResource } = useChatResourceManager(currentConversation);

    // Callback function
    const handleResourceClick = async (resourceKey, endpoint) => {
        await fetchResource(resourceKey, endpoint);
        setCurrentResource({
            conversationId: currentConversation?._id,
            resourceKey: resourceKey
        })
    }

    return (
        <section className="chat-resources">
            <header>
                <h1>Chat Resources</h1>
                <i className="fa-solid fa-angle-right"></i>
            </header>
            <ChatResourceItemList 
                resources={resources}
                onResourceClick={handleResourceClick}
                currentResource={currentResource}
                currentConversationId={currentConversation?._id}
            />
            <CurrentChatResourceDetail
                currentResource={currentResource}
                messages={messagesWithCurrentResource}
            />
        </section>
    )
}

export default ChatResources