import { useResumeStore } from "../../stores/resumeStore";
import { useAuthStore } from "../../stores/authStore";
import { Link } from "react-router-dom"

function UserProfileSection() {
    const user = useAuthStore(state => state.user);
    const jobTitle = useResumeStore(state => state.currentResume?.jobTitle?.name);
    const isLoading = useAuthStore(state => state.isLoading);

    const fullName = `${user.firstName} ${user.lastName}`

    return(
        <section className={`grid-item ${!isLoading ? '' : 'skeleton'}`} id="profile">
            {!isLoading && (
                <>
                    <Link to={`profile/${user._id}`} className="image-container" aria-label={`Go to ${fullName}'s profile`}>
                        {user.profilePicture ? (
                            <img src={user.profilePicture} alt={`${fullName}'s profile picture`} />
                        ) : (
                            <img src={`public/profile_pictures/default.jpg`}/>
                        )}
                        <div className="details">
                            <h2 className="name">{fullName}</h2>
                            <h4 className="job-title">{jobTitle}</h4>
                            <p className="address"><i className="fa-solid fa-location-dot" aria-hidden="true"></i>Legazpi City, Philippines</p>
                        </div>
                    </Link>
                </>
            )}
        </section>
    )
}

export default UserProfileSection