import { Link, useLocation } from "react-router-dom";

function Navbar () {
    const location = useLocation();
    const hideLocation = location.pathname == '/register'
    return (
        <>
            <nav className="navbar">
                <Link className="logo" to={'/'}>
                    <img src="/public/media/icons8-opportunity-24.png" alt="" />
                </Link>
                {!hideLocation && (
                    <ul className="navbar-links">
                        <li><Link to='/register' className="sign-in-link">Sign In</Link></li>
                    </ul>
                )}
            </nav>
        </>
    )
}

export default Navbar