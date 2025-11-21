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
                        data={[...messages].reverse()}
                        firstItemIndex={0}
                        initialTopMostItemIndex={0}
                        itemContent={(index) => {
                            const group = [...messages].reverse()[index];
                            return <MessageGroup key={group._id || index} group={group} />;
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