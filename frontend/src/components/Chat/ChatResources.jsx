import { useState } from "react"
import { useChatResources } from "../../hooks/chats/useChatResources";
import { useData } from "../../contexts/DataProvider";
import ChatResourceItemList from "./chat_resource_components/ChatResourceItemList";

function ChatResources({ currentConversation }) {
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
        </section>
    )
}

export default ChatResources