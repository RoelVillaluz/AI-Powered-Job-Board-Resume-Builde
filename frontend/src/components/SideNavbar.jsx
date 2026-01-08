import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

function SideNavbar () {
    // const { user, logout } = useAuth();
    const user = useAuthStore(state => state.user);
    const logout = useAuthStore(state => state.logout);
    
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
        { to: '/', icon: 'fa-solid fa-house', label: 'Home' },
        { to: '/messages', icon: 'fa-solid fa-envelope', label: 'Messages' },
    ]

    if (user?.role === 'jobseeker') {
        links.push(
            { to: '/job-postings', icon: 'fa-solid fa-briefcase', label: 'Job Postings' },
            { to: '/resumes', icon: 'fa-solid fa-file-invoice', label: 'Resumes' },
            { to: '/courses', icon: 'fa-solid fa-graduation-cap', label: 'Online Courses' }
        )
    } else if (user?.role === 'employer') {
        links.push(
            { to: 'create-job-posting', icon: 'fa-solid fa-square-plus', label: 'Create Job Posting' },
            { to: '/applicants', icon: 'fa-solid fa-users', label: 'Applicants' },
        )
    }

    return (
        <>
            {!hideLocation && user && (
                <aside className="sidebar-navbar">
                    <nav>
                        <Link className="logo" to={'/'} aria-label="Logo/Home Icon">
                            <img src="/public/media/icons8-opportunity-24.png" alt="" />
                        </Link>
                        <ul>
                        <ul>
                            {links.map(({ to, icon, label }) => (
                                    <li key={to} className={location.pathname === to ? "active" : ""}>
                                        <Link to={to} aria-label={label}>
                                            <i className={icon}></i>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </ul>
                        <ul>
                            <li>
                                <Link to={'/settings'} aria-label="Settings">
                                    <i className="fa-solid fa-gear"></i>
                                </Link>
                            </li>
                            <li>
                                <button id="logout-btn" aria-label="Logout" onClick={logout}>
                                    <i className="fa-solid fa-right-from-bracket"></i>
                                </button>
                            </li>
                        </ul>
                    </nav>
                </aside>
            )}
        </>
    )
}

export default SideNavbar