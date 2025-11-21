import { useMemo } from "react"

const ChatResourceItemList = ({ resources }) => {
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

    const resourceItemsMap = useMemo(
        () => [
            { icon: "folder", label: "Attachments", resourceKey: "attachments", endPoint: "attachments" },
            { icon: "link", label: "Links", resourceKey: "links", endPoint: "links" },
            { icon: "thumbtack", label: "Pinned Messages", resourceKey: "pinnedMessages", endPoint: "pinned-messages" },
            { icon: "calendar-days", label: "Scheduled Events", resourceKey: "scheduledEvents", endPoint: "scheduled-events" }
        ], []
    );

    return (
        <ul>
            {resourceItemsMap.map(({ icon, label, resourceKey, endPoint }) => 
                renderResourceItem(icon, label, resourceKey, endPoint)
            )}
        </ul>
    )
}

export default ChatResourceItemList