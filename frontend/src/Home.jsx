import { useEffect } from "react";
import { useData } from "./DataProvider.jsx"

function Home () {
    const { users, setUsers, getAllData } = useData();

    useEffect(() => {
        document.title = 'Home'

        getAllData(["users"])
    }, [])

    return (
        <>
            <h1>Home</h1>
            <ul>
                {users.map((user) =>(
                    <li key={user._id}>
                        <h3>{user.username}</h3>
                        
                    </li>
                ))}
            </ul>
        </>
    )
}

export default Home