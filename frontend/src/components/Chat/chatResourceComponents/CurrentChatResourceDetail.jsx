import { useEffect } from "react"
function CurrentChatResourceDetail({ currentResource, messages }) {

    useEffect(() => {
        console.log('Messages: ', messages)
    }, [messages])

    return (
        <div className="current-chat-resource">
           <ul>
                {messages.map((message) => (
                    <li key={message._id}>{message.content}</li>
                ))}
           </ul> 
        </div>
    )
}

export default CurrentChatResourceDetail