import { Link } from "react-router-dom"

function UserStreakSection() {
    return (
        <>
            <section className="grid-item" id="user-streak">
                <div className="streak-count">
                    <i className="fa-solid fa-fire"></i>
                    <span>0 days</span>
                    <p>Streak</p>
                </div>
                <div className="streak-days">
                    <div className="row">
                        <h5>Log in daily to get rewards</h5>
                        <Link to={'/login-rewards'}>See rewards <i className="fa-solid fa-angle-right"></i></Link>
                    </div>
                    <ul>
                        <li>
                            <div className="status"><i class="fa-solid fa-check"></i></div>
                            <span>Mon</span>
                        </li>
                        <li>
                            <div className="status"></div>
                            <span>Tue</span>
                        </li>
                        <li>
                            <div className="status"></div>
                            <span>Wed</span>
                        </li>
                        <li>
                            <div className="status"></div>
                            <span>Thu</span>
                        </li>
                        <li>
                            <div className="status"></div>
                            <span>Fri</span>
                        </li>
                        <li>
                            <div className="status"></div>
                            <span>Sat</span>
                        </li>
                        <li>
                            <div className="status"></div>
                            <span>Sun</span>
                        </li>
                    </ul>
                </div>
            </section>
        </>
    )
}

export default UserStreakSection