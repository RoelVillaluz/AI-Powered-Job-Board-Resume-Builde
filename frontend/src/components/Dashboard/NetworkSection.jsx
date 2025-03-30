import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useData } from "../../DataProvider"
import axios from "axios";

function NetworkSection({ user, baseUrl }) {
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
        e.preventDefault();
        
        try {
            const response = await axios.post(`${baseUrl}/users/send-connection-request`, {
                userId,
                connectionId
            })

            console.log(response.data)
        } catch (error) {
            console.error('Error:', error)
        }
    }

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
                        <button onClick={(e) => user && toggleApplicationRequest(e, user._id, connectionRecommendation._id)}>
                            {user.connections.some(conn => conn.user.toString() === connectionRecommendation._id) 
                            ? (
                                <i className="fa-solid fa-user-minus" aria-hidden="true"></i>
                            ) : (
                                <i className="fa-solid fa-user-plus" aria-hidden="true"></i>
                            )}
                        </button>
                    </li>
                ))}
            </ul>
            <Link>Find more<i className="fa-solid fa-arrow-right"></i></Link>
        </section>
    )
}

export default NetworkSection