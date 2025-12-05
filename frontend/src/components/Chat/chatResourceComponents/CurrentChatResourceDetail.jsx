import { useEffect } from "react"
import AttachmentGrid from "./ChatResourceTypeComponents/AttachmentsGrid"

function CurrentChatResourceDetail({ currentResource, messages }) {

    useEffect(() => {
        console.log(`${currentResource.resourceKey}: `, messages)
    }, [messages])

    const displayResourceTypeElement = () => {
        if (currentResource.resourceKey === 'attachments') {
            return <AttachmentGrid messages={messages}/>
        }
    }

    return (
        <div className="current-chat-resource">
           {displayResourceTypeElement()}
        </div>
    )
}

export default CurrentChatResourceDetail