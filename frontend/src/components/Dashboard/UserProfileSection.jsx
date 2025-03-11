import { Link } from "react-router-dom"

function UserProfileSection({ user, name, loading }) {
    return(
        <section className={`grid-item ${loading !== true ? '' : 'skeleton'}`} id="profile">
            {loading !== true && (
                <>
                    <header>
                        <h3>Profile</h3>
                    </header>
                    <Link to={'my-profile'} className="image-container" aria-label={`Go to ${name}'s profile`}>
                        <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
                        <img src={user.profilePicture} alt={`${name}'s profile picture`} />
                        <div className="details">
                            <h4 className="name">{name}</h4>
                            <h5 className="job-title">Full Stack Developer</h5>
                        </div>
                    </Link>
                </>
            )}
        </section>
    )
}

export default UserProfileSection