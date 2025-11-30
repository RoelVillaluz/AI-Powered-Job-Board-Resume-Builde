export const RESOURCE_TYPES = [
    { type: 'pinnedMessages', endpoint: 'pinned-messages' },
    { type: 'attachments', endpoint: 'attachments' },
    { type: 'links', endpoint: 'links' },
]

export const RESOURCE_TYPES_WITH_ICONS = [
    { icon: "folder", label: "Attachments", resourceKey: "attachments", endPoint: "attachments" },
    { icon: "link", label: "Links", resourceKey: "links", endPoint: "links" },
    { icon: "thumbtack", label: "Pinned Messages", resourceKey: "pinnedMessages", endPoint: "pinned-messages" },
    { icon: "calendar-days", label: "Scheduled Events", resourceKey: "scheduledEvents", endPoint: "scheduled-events" }
]

export const INITIAL_RESOURCE_STATE = {
    pinnedMessages: { data: [], count: 0 },
    attachments: { data: [], count: 0 },
    links: { data: [], count: 0 },
    scheduledEvents: { data: [], count: 0 }
};

export function getResourceState(resources, conversationId) {
    if (!conversationId) return INITIAL_RESOURCE_STATE;
    return resources[conversationId] || INITIAL_RESOURCE_STATE;
}
