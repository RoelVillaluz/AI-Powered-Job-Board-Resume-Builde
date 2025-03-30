import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useData } from "../../DataProvider"

function NetworkSection() {
    const { user, users, getAllData } = useData();
    const [connectionRecommendations, setConnectionRecommendations] = useState([]);

    useEffect(() => {
        getAllData(["users"])
    }, [])

    useEffect(() => {
        setConnectionRecommendations(users)
        console.log("Connection recommendations:", connectionRecommendations)
    }, [users])

    return (
        <section className="grid-item" id="networks">
            <header>
                <h4>Networks</h4>
            </header>
            <ul>
                {connectionRecommendations.slice(0, 3).map((user) => (
                    <li key={user._id}>
                        <img src={user.profilePicture} alt={`${user.name}'s profile picture`} />
                        <div className="person-info">
                            <h4>{user.name}</h4>
                            <p>{user.role}</p>
                        </div>
                        <button>
                            <i className="fa-solid fa-user-plus" aria-hidden="true"></i>
                        </button>
                    </li>
                ))}
            </ul>
            <Link>Find more<i className="fa-solid fa-arrow-right"></i></Link>
        </section>
    )
}

export default NetworkSection