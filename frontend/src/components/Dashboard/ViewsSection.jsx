import { Link } from "react-router-dom"

function ViewsSection({ loading }) {
    return (
        <>
            <section className={`grid-item ${!loading ? '' : 'skeleton'}`} id="views">
                {!loading && (
                    <>
                        <header>
                            <h4>Views</h4>
                            <Link to={'profile/viewers'} aria-label={`See who viewed your profile`}>
                                <i className="fa-solid fa-arrow-right"></i>
                            </Link>
                        </header>
                            <img src="/public/media/pexels-kampus-6605421.jpg" aria-hidden="true"/>
                            <img src="/public/media/pexels-moose-photos-170195-1587009.jpg" aria-hidden="true"/>
                            <img src="/public/media/pexels-tima-miroshnichenko-6694958.jpg" aria-hidden="true"/>
                        <div>
                            <div className="count">
                                <h2>100</h2>
                                <div className="percentage-change" aria-label="Percentage of increase in views">
                                    <span>5%</span>
                                    <i className="fa-solid fa-arrow-trend-up"></i>
                                </div>
                            </div>
                            <p>New Profile Visits</p>
                        </div>
                    </>
                )}
            </section>
        </>
    )
}

export default ViewsSection