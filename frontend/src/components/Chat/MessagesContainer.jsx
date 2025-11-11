import { useData } from "../../contexts/DataProvider";
import { ReadReceiptsProvider } from "../../contexts/ReadReciptsContext";
import MessageGroup from "./MessageGroup";
import { Virtuoso } from "react-virtuoso";
import { useMessageOperationsContext } from "../../contexts/chats/MessageOperationsContext";

function MessagesContainer({ showComposeMessage, messages }) {
    const { baseUrl } = useData();
    const { loadOlderMessages } = useMessageOperationsContext();

    return (
        <ReadReceiptsProvider>
            <div className="messages-container" style={{ height: '100%' }}>
                {!showComposeMessage && messages.length > 0  && (
                    <Virtuoso
                        data={messages}
                        firstItemIndex={0} // for prepending older messages
                        initialTopMostItemIndex={messages.length - 1} // scroll to bottom (last message)
                        itemContent={(index) => {
                            const group = messages[index];
                            if (!group) return null;
                            return <MessageGroup key={group._id || index} group={group}/>
                        }}
                        atTopStateChange={(atTop) => {
                            if (atTop) loadOlderMessages?.();
                        }}
                        followOutput="auto"
                        style={{ height: '100%' }}
                    />
                )}
            </div>
        </ReadReceiptsProvider>
    )
}

export default MessagesContainer