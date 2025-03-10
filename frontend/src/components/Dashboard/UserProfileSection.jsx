import { Link } from "react-router-dom"

function UserProfileSection({ user, name, loading }) {
    return(
        <>
            <section className={`grid-item ${loading !== true ? '' : 'skeleton'}`} id="profile">
                {loading !== true && (
                    <Link to={'my-profile'} className="image-container">
                        <header>
                            <h3>Profile</h3>
                        </header>
                        <i className="fa-solid fa-arrow-right"></i>
                        <img src={user.profilePicture} alt="" />
                        <div className="details">
                            <h4 className="name">{name}</h4>
                            <h5 className="job-title">Full Stack Developer</h5>
                        </div>
                    </Link>
                )}
            </section>
        </>
    )
}

export default UserProfileSection