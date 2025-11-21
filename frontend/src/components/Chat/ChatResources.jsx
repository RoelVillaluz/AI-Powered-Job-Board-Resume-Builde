import { useState } from "react"
import { useChatResources } from "../../hooks/chats/useChatResources";
import { useData } from "../../contexts/DataProvider";
import ChatResourceItemList from "./chat_resource_components/ChatResourceItemList";

function ChatResources({ currentConversation }) {
    const { baseUrl } = useData();
    const { resources, fetchResourceType } = useChatResources(currentConversation);
    const [currentResource, setCurrentResource] = useState(null);

    return (
        <section className="chat-resources">
            <header>
                <h1>Chat Resources</h1>
                <i className="fa-solid fa-angle-right"></i>
            </header>
            <ChatResourceItemList 
                resources={resources}
            />
        </section>
    )
}

export default ChatResources