import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useData } from "../../DataProvider"
import axios from "axios";
import { useAuth } from "../AuthProvider";

function NetworkSection({ user, baseUrl }) {
    const { setUser } = useAuth();
    const { users, getAllData } = useData();
    const [connectionRecommendations, setConnectionRecommendations] = useState([]);

    useEffect(() => {
        getAllData(["users"])
    }, [])

    useEffect(() => {
        console.log("User:", user);
        console.log("Users:", users);
    
        if (user && users?.length) {
            const filteredUsers = users.filter(u => u._id !== user._id && u.role === 'jobseeker');
            console.log("Filtered Users:", filteredUsers);
            setConnectionRecommendations(filteredUsers);
        }
    }, [users, user]);

    const toggleApplicationRequest = async (e, userId, connectionId) => {
        console.log("Button clicked! Preventing default...");
        e.preventDefault(); 
        e.stopPropagation();
    
        try {
            const response = await axios.post(`${baseUrl}/users/send-connection-request`, 
                { userId, connectionId },
                { headers: { "Content-Type": "application/json" } }
            );
    
            if (response.data.success) {
                setUser(prevUser => {
                    if (!prevUser) return prevUser;
                    return {
                        ...prevUser,
                        connections: response.data.connections,
                    };
                });                
            }
        } catch (error) {
            console.error('Error:', error);
        }
        
        return false;
    };

    return (
        <section className="grid-item" id="networks">
            <header>
                <h4>Networks</h4>
            </header>
            <ul>
                {connectionRecommendations.slice(0, 3).map((connectionRecommendation) => (
                    <li key={connectionRecommendation._id}>
                        <img src={connectionRecommendation.profilePicture} alt={`${connectionRecommendation.name}'s profile picture`} />
                        <div className="person-info">
                            <h4>{connectionRecommendation.name}</h4>
                            <p>{connectionRecommendation.role}</p>
                        </div>
                        <button type="button" onClick={(e) => user && toggleApplicationRequest(e, user._id, connectionRecommendation._id)}>
                            {user?.connections?.some(conn => conn.user.toString() === connectionRecommendation._id) 
                                ? <i className="fa-solid fa-user-minus"></i>
                                : <i className="fa-solid fa-user-plus"></i>
                            }
                        </button>
                    </li>
                ))}
            </ul>
            <Link to={'connections'}>Find more<i className="fa-solid fa-arrow-right"></i></Link>
        </section>
    )
}

export default NetworkSection