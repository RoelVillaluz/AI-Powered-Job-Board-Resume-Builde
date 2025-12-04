import { useMemo } from "react"
import { RESOURCE_TYPES_WITH_ICONS } from "../../../../../shared/constants/chats/chatResourceTypes"

const ChatResourceItemList = ({ resources, onResourceClick, currentResource, currentConversationId }) => {

    const renderResourceItem = (icon, label, resourceKey, endpoint) => {
        const resource = resources[resourceKey] || {
            count: 0,
            loading: false,
            error: null
        }

        return (
            <li className={`resource-item ${isActive ? 'active' : ''}`} onClick={() => onResourceClick(resourceKey, endpoint)} key={resourceKey}>
                <i className={`fa-solid fa-${icon}`}></i>
                <div>
                    <strong>{label}</strong>
                    {resource.loadingCounts ? (
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

    const resourceItemsMap = useMemo(
        () => RESOURCE_TYPES_WITH_ICONS, []
    );

    return (
        <ul>
            {resourceItemsMap.map(({ icon, label, resourceKey, endpoint }) => 
                renderResourceItem(icon, label, resourceKey, endpoint)
            )}
        </ul>
    )
}

export default ChatResourceItemList