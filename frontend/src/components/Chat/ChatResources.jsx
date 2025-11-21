import { useEffect, useState, useMemo } from "react"
import { useChatResources } from "../../hooks/chats/useChatResources";
import { useData } from "../../contexts/DataProvider";
import axios from "axios";

const resourceItemSkeleton = () => {

}

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
            <ul>
                <li className="resource-item">
                    <i className="fa-solid fa-folder"></i>
                    <div>
                        <strong>Attachments</strong>
                        <p>{resources?.attachments?.count} Items</p>
                    </div>
                    <i className="fa-solid fa-angle-right"></i>
                </li>
                <li className="resource-item">
                    <i className="fa-solid fa-link"></i>
                    <div>
                        <strong>Links</strong>
                        <p>{resources?.links?.count} Items</p>
                    </div>
                    <i className="fa-solid fa-angle-right"></i>
                </li>
                <li className="resource-item">
                    <i className="fa-solid fa-thumbtack"></i>
                    <div>
                        <strong>Pinned Messages</strong>
                        <p>{resources?.pinnedMessages?.count} Items</p>
                    </div>
                    <i className="fa-solid fa-angle-right"></i>
                </li>
                <li className="resource-item">
                    <i className="fa-solid fa-calendar-days"></i>
                    <div>
                        <strong>Scheduled Events</strong>
                        <p>{resources?.scheduledEvents?.count} Items</p>
                    </div>
                    <i className="fa-solid fa-angle-right"></i>
                </li>
            </ul>
        </section>
    )
}

export default ChatResources