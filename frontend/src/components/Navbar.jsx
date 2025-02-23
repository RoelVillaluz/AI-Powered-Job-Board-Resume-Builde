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

    console.log("Stored User in Local Storage:", localStorage.getItem("user"));

    return (
        <>
            <nav className='navbar'>
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
                                            <Link>
                                                <i className="fa-solid fa-briefcase"></i>
                                                <span>Manage Jobs</span>
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
            </nav>
        </>
    )
}

export default Navbar