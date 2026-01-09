import { useEffect, useState, useCallback } from "react"
import { Link } from "react-router-dom"
import axios from "axios";
import { BASE_API_URL } from "../../config/api";
import { useAuthStore } from "../../stores/authStore";

function NetworkSection() {
    const user = useAuthStore(state => state.user);
    const token = useAuthStore(state => state.token);
    const [connectionRecommendations, setConnectionRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchRecommendations = useCallback(async () => {
        if (!user?._id || !token) return;

        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(
                `${BASE_API_URL}/users/${user._id}/connection-recommendations`,
                {
                headers: { Authorization: `Bearer ${token}` }
                }
            );

            setConnectionRecommendations(response.data.data);
        } catch (err) {
            console.error('Error fetching connection recommendations', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user?._id, token]);

    useEffect(() => {
        if (!user && !token) return

        fetchRecommendations()
    }, [fetchRecommendations])

    const toggleApplicationRequest = async (e, connectionId) => {
        e.preventDefault();
        e.stopPropagation();
    
        try {
            const response = await axios.post(`${BASE_API_URL}/users/send-connection-request`, 
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
                            <h4>{connectionRecommendation.firstName} {connectionRecommendation.lastName}</h4>
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