import { useState, useEffect } from "react";
import axios from "axios";

export const useConversations = (baseUrl, userId) => {
    const [conversations, setConversations] = useState([]);
    const [currentConversation, setCurrentConversation] = useState(null);

    useEffect(() => {
        const fetchUserConversations = async () => {
            try {
                const response = await axios.get(`${baseUrl}/conversations/user/${userId}`)
                const fetchedConversations = response.data.data;

                // Sort conversations by latest message timestamp descending
                const sortedConversations = fetchedConversations.sort((a, b) => {
                    return new Date(b.updatedAt) - new Date(a.updatedAt);
                })

                setConversations(sortedConversations)

                if (sortedConversations.length > 0) {
                    setCurrentConversation(sortedConversations[0])
                }

                console.log('User conversations: ', fetchedConversations)
            } catch (error) {
                console.log('Error fetching conversations')
            }
        }
        if (userId) {
            fetchUserConversations();
        }
    }, [baseUrl, userId])

    return { conversations, setConversations, currentConversation, setCurrentConversation };
}
