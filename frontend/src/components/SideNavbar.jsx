import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

function SideNavbar () {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const hideNavbarLocations = ['/register', '/login', '/get-started', '/sign-in']
    const hideLocation = hideNavbarLocations.some(path => location.pathname === path)
    const [isVisible, setIsVisible] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem("user");
        setUser(null);
        navigate('')
    }

    const links = [
        { to: '/', icon: 'fa-solid fa-house'},
        { to: '/job-postings', icon: 'fa-solid fa-briefcase'},
        { to: '/messages', icon: 'fa-solid fa-envelope'},
        { to: '/resumes', icon: 'fa-solid fa-file-invoice'},
        { to: '/courses', icon: 'fa-solid fa-graduation-cap'}
    ]

    return (
        <>
            {!hideLocation && user && (
                <aside className="sidebar-navbar">
                    <nav>
                        <Link className="logo" to={'/'}>
                            <img src="/public/media/icons8-opportunity-24.png" alt="" />
                        </Link>
                        <ul>
                        <ul>
                            {links.map(({ to, icon }) => (
                                    <li key={to} className={location.pathname === to ? "active" : ""}>
                                        <Link to={to}>
                                            <i className={icon}></i>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </ul>
                        <Link to={'/settings'}>
                            <i className="fa-solid fa-gear"></i>
                        </Link>
                    </nav>
                </aside>
            )}
        </>
    )
}

export default SideNavbar