import axios from "axios";
import { useEffect, useState } from "react"
import { useData } from "../DataProvider";
import { useParams } from "react-router-dom";

function ProfileDetailPage() {
    const [profile, setProfile] = useState(null);
    const { userId } = useParams();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await axios.get(`${baseUrl}/users/${userId}`)
                console.log(response.data.data)
                setProfile(response.data.data)
            } catch (error) {
                console.log('Error', error)
            }
        }
        fetchProfile()
    }, [userId])

    useEffect(() => {
        document.title = `${profile.name}'s Profile`
    })

    return (
        <>
            <header>
                <div className="banner"></div>
            </header>
        </>
    )
}

export default ProfileDetailPage