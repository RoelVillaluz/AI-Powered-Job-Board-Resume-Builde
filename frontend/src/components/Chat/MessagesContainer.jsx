import { useData } from "../../contexts/DataProvider";
import { ReadReceiptsProvider } from "../../contexts/ReadReciptsContext";
import MessageGroup from "./MessageGroup";
import { Virtuoso } from "react-virtuoso";
import { useMessageOperationsContext } from "../../contexts/chats/MessageOperationsContext";

function MessagesContainer({ showComposeMessage, messages }) {
    const { loadOlderMessages } = useMessageOperationsContext();

    return (
        <ReadReceiptsProvider>
            <div className="messages-container" style={{ height: '100%' }}>
                {!showComposeMessage && messages.length > 0 && (
                    <Virtuoso
                        data={messages}
                        initialTopMostItemIndex={messages.length - 1}
                        itemContent={(index, group) => (
                            <MessageGroup key={group._id || index} group={group} />
                        )}
                        startReached={loadOlderMessages}
                        followOutput="smooth"
                        style={{ height: '100%' }}
                    />
                )}
            </div>
        </ReadReceiptsProvider>
    )
}

export default MessagesContainer