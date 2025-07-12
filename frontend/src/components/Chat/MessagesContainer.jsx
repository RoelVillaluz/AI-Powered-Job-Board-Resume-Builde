import { useData } from "../../contexts/DataProvider";
import { useChatContext } from "../../contexts/ChatContext";
import { ReadReceiptsProvider } from "../../contexts/ReadReciptsContext";
import useMessageOperations from "../../hooks/chats/useMessageOperations"
import MessageGroup from "./MessageGroup";

function MessagesContainer({ showComposeMessage, messages }) {
    const { baseUrl } = useData();

    return (
        <ReadReceiptsProvider>
            <div className="messages-container">
                {!showComposeMessage && (
                    <ul>
                        {messages.length > 0 && (
                            messages.map((group, groupIndex) => (
                                <MessageGroup 
                                    group={group} 
                                    key={groupIndex}
                                />
                            ))
                        )}
                    </ul>
                )}
            </div>
        </ReadReceiptsProvider>
    )
}

export default MessagesContainer