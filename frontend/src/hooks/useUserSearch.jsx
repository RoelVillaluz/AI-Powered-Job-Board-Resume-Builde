import { useState, useEffect } from "react";
import axios from "axios";

export const useUserSearch = (baseUrl) => {
    const [searchReceiverQuery, setSearchReceiverQuery] = useState('')
    const [searchReceiverResults, setSearchReceiverResults] = useState([]);

    // Fetch users based on search input in compose message section
    useEffect(() => {
        if (!searchReceiverQuery.trim()) {
            setSearchReceiverResults([])
            return
        }

        const timeoutId = setTimeout(async() => {
            try {
                const response = await axios.get(`${baseUrl}/users/search`, {
                    params: { q: searchReceiverQuery, limit: 10 }
                });

                console.log(`Search results for query: ${searchReceiverQuery}`, searchReceiverResults)

                setSearchReceiverResults(response.data.data)
            } catch (error) {
                console.error("Search error", error);
            }
        }, 200) 

        
        return () => clearTimeout(timeoutId)
    }, [baseUrl, searchReceiverQuery])

    return { searchReceiverQuery, setSearchReceiverQuery, searchReceiverResults }
}