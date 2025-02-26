import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

function Navbar () {
    const location = useLocation();
    const navigate = useNavigate();
    const hideLocation = location.pathname == '/register' || location.pathname == '/login' || location.pathname == '/get-started' || location.pathname == '/sign-in'
    const { user, setUser } = useAuth();
    const [isVisible, setIsVisible] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem("user");
        setUser(null);
        navigate('')
    }

    return (
        <>
            {/* <nav className='navbar'>
                <Link className="logo" to={'/'}>
                    <img src="/public/media/icons8-opportunity-24.png" alt="" />
                </Link>
                {!hideLocation && (
                    <ul className="navbar-links">
                        {user ? (
                            <li className="nav-icon" onClick={() => setIsVisible(!isVisible)}>
                                <i className="fa-regular fa-user"></i>
                                <ul className={`dropdown ${isVisible ? 'visible': 'hidden'}`}>
                                    <li>
                                        <Link>
                                            <i className="fa-solid fa-user"></i>
                                            <span>My Profile</span>
                                        </Link>
                                    </li>
                                    {user.role === 'employer' && (
                                        <li>
                                            <Link to={'/create-job-posting'}>
                                                <i className="fa-solid fa-briefcase"></i>
                                                <span>Create Job</span>
                                            </Link>
                                        </li>
                                    )}
                                    <li onClick={handleLogout}>
                                        <Link>
                                            <i className="fa-solid fa-right-from-bracket"></i>
                                            <span>Sign Out</span>
                                        </Link>
                                    </li>
                                </ul>
                            </li>
                        ) : (
                            <li>
                                <Link to="/sign-in" className="sign-in-link">
                                    Sign In
                                </Link>
                            </li>
                        )}
                    </ul>
                )}
            </nav> */}
            <aside className="sidebar-navbar">
                <nav>
                    <Link className="logo" to={'/'}>
                        <img src="/public/media/icons8-opportunity-24.png" alt="" />
                    </Link>
                    <ul>
                        <li>
                            <Link to={'/'}>
                                <i className="fa-solid fa-house"></i>
                            </Link>
                        </li>
                        <li>
                            <Link to={'/jobs'}>
                                <i className="fa-solid fa-briefcase"></i>
                            </Link>
                        </li>
                        <li>
                            <Link to={'/messages'}>
                                <i className="fa-solid fa-envelope"></i>
                            </Link>
                        </li>
                        <li>
                            <Link to={'/resumes'}>
                                <i className="fa-solid fa-file-invoice"></i>
                            </Link>
                        </li>
                    </ul>
                    <Link to={'/settings'}>
                        <i class="fa-solid fa-gear"></i>
                    </Link>
                </nav>
            </aside>
        </>
    )
}

export default Navbar