import { Link } from "react-router-dom";

function Navbar () {
    return (
        <>
            <nav className="navbar">
                <Link className="logo" path={'/'}>
                    <img src="/public/media/icons8-opportunity-24.png" alt="" />
                </Link>
                <ul className="navbar-links">
                    <li><Link to='/register' className="sign-in-link">Sign In</Link></li>
                </ul>
            </nav>
        </>
    )
}

export default Navbar