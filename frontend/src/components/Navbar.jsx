import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

function Navbar () {
    const location = useLocation();
    const hideLocation = location.pathname == '/register' || location.pathname == '/login' || location.pathname == '/get-started'
    const [user, setUser] = useState(null)
    const [isVisible, setIsVisible] = useState(false);

    // Check if user is logged in
    useEffect(() => {
        const storedUser = localStorage.getItem("user"); // Fetch from localStorage
        if (storedUser) {
            setUser(JSON.parse(storedUser)); // Parse and set user state
        }
    }, []);

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
                                <i class="fa-regular fa-user"></i>
                                <ul className={`dropdown ${isVisible ? 'visible': 'hidden'}`}>
                                    <li>
                                        <i className="fa-solid fa-user"></i>
                                        <span>My Profile</span>
                                    </li>
                                    <li>
                                        <i className="fa-solid fa-right-from-bracket"></i>
                                        <span>Sign Out</span>
                                    </li>
                                </ul>
                            </li>
                        ) : (
                            <li>
                                <Link to="/register" className="sign-in-link">
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