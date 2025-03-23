import axios from "axios"
import { useEffect } from "react"
import { Link } from "react-router-dom"

function UserProfileSection({ user, name, loading }) {

    return(
        <section className={`grid-item ${!loading ? '' : 'skeleton'}`} id="profile">
            {!loading && (
                <>
                    <Link to={`profile/${user._id}`} className="image-container" aria-label={`Go to ${name}'s profile`}>
                        <img src={user.profilePicture} alt={`${name}'s profile picture`} />
                        <div className="details">
                            <h2 className="name">{name}</h2>
                            <h4 className="job-title">Full Stack Developer</h4>
                            <p className="address"><i className="fa-solid fa-location-dot" aria-hidden="true"></i>Legazpi City, Philippines</p>
                        </div>
                    </Link>
                </>
            )}
        </section>
    )
}

export default UserProfileSection