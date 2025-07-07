import { useChatContext } from "../../contexts/ChatContext";
import { useData } from "../../contexts/DataProvider"
import { useUserSearch } from "../../hooks/chats/useUserSearch.jsx"

function ChatWindowHeader({ user, currentConversation, showComposeMessage, currentReceiver, setCurrentReceiver }) {
    const { baseUrl } = useData();
    const { formData, handleChange } = useChatContext();
    const { searchReceiverQuery, setSearchReceiverQuery, searchReceiverResults } = useUserSearch(baseUrl)

    const handleRemoveReceiver = () => {
        handleChange("receiver", "")
        setCurrentReceiver(null)
    }

    const handleReceiverSelect = (result) => {
        handleChange("receiver", result._id)
        setCurrentReceiver(result)
        setSearchReceiverQuery('')
    }

    if (currentConversation && !showComposeMessage) {
        return (
             <header>
                <div className="user">
                    <img src={currentConversation.receiver.profilePicture} alt="" />
                    <address>
                        <strong>{currentConversation.receiver.name}</strong>
                        <span>{currentConversation.receiver.email}</span>
                    </address>
                </div>
                <div className="actions">
                    <i className="fa-solid fa-phone"></i>
                    <i className="fa-solid fa-video"></i>
                    <i className="fa-solid fa-ellipsis"></i>
                </div>
            </header>
        )
    } else {
        return (
            <header className="compose-message">
                <h1>New Message</h1>
                <div className="send-to">
                    <label>To:</label>
                    {formData.receiver === '' ? (
                        <input type="text" placeholder="Search for a name" value={searchReceiverQuery} onChange={(e) => setSearchReceiverQuery(e.target.value)}/>
                    ) : (
                        <div className="selected-receiver">
                            <img src={currentReceiver.profilePicture} alt={`${currentReceiver.name}'s profile picture`} />
                            <strong>{currentReceiver.name}</strong>
                            <button className="remove-receiver-btn" onClick={() => handleRemoveReceiver()}>
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                    )}

                    {searchReceiverResults.length > 0 && ( 
                        <ul className="results">
                            {searchReceiverResults.filter(r => r._id !== user._id).map((result, index) => (
                                <li key={index}>
                                    <button onClick={() => handleReceiverSelect(result)}>
                                        <img src={result.profilePicture} alt={`${result.name}'s profile picture`} />
                                        <strong>{result.name}</strong>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )} 

                </div>
            </header>
        )
    }
    
}

export default ChatWindowHeader