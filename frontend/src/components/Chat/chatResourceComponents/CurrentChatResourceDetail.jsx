import { useEffect } from "react"
import AttachmentGrid from "./ChatResourceTypeComponents/AttachmentsGrid"
import LinkPreviews from "./ChatResourceTypeComponents/LinkPreviews"

function CurrentChatResourceDetail({ currentResource, messages }) {

    useEffect(() => {
        console.log(`${currentResource.resourceKey}: `, messages)
    }, [messages])

    const displayResourceTypeElement = () => {
        if (currentResource.resourceKey === 'attachments') {
            return <AttachmentGrid messages={messages}/>
        } 

        if (currentResource.resourceKey === 'links') {
            return <LinkPreviews messages={messages}/>
        }
    }

    return (
        <div className="current-chat-resource">
           {displayResourceTypeElement()}
        </div>
    )
}

export default CurrentChatResourceDetail