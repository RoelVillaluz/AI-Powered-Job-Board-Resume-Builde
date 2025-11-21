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
    const renderResourceItem = (icon, label, resourceKey, endPoint) => {
        const resource = resources[resourceKey] || {
            count: 0,
            loading: false,
            error: null
        }

        return (
            <li className="resource-item">
                <i className={`fa-solid fa-${icon}`}></i>
                <div>
                    <strong>{label}</strong>
                    {resource.loading ? (
                        <div className="skeleton text" style={{ 
                            height: '1.25rem', 
                            width: '10rem', 
                            marginTop: '0.5rem' 
                        }}></div>
                        ) : resource.error ? (
                            <p className="error-text">Error loading</p>
                        ) : (
                            <p>{resource.count} Item{resource.count !== 1 ? 's' : ''}</p>
                        )}
                </div>
                <i className="fa-solid fa-angle-right"></i>
            </li>
        )
    }

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