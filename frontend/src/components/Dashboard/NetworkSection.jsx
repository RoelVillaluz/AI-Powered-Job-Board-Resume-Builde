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
    }, [users]);

    const toggleApplicationRequest = async (e, connectionId) => {
        e.preventDefault();
        e.stopPropagation();
    
        try {
            const response = await axios.post(`${baseUrl}/users/send-connection-request`, 
                { userId: user._id, connectionId },
                { headers: { "Content-Type": "application/json" } }
            );
    
            if (response.status === 200) {
                setUser(prevUser => {
                    if (!prevUser) return prevUser;
    
                    const isConnected = prevUser.connections.some(conn => conn.user === connectionId);
                    const updatedConnections = isConnected
                        ? prevUser.connections.filter(conn => conn.user !== connectionId) // Remove connection
                        : [...prevUser.connections, { user: connectionId }]; // Add connection
    
                    return { ...prevUser, connections: updatedConnections };
                });
            }
            
            console.log(response);
        } catch (error) {
            console.error('Error:', error);
        }
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
                        <button
                            type="button"
                            onClick={(e) => toggleApplicationRequest(e, connectionRecommendation._id)}
                        >
                            {user?.connections?.some(conn => conn.user === connectionRecommendation._id)
                                ? <i className="fa-solid fa-user-minus"></i> 
                                : <i className="fa-solid fa-user-plus"></i>}
                        </button>
                    </li>
                ))}
            </ul>
            <Link to={'connections'}>Find more<i className="fa-solid fa-arrow-right"></i></Link>
        </section>
    )
}

export default NetworkSection