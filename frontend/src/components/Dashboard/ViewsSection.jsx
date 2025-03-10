import { Link } from "react-router-dom"

function ViewsSection({ loading }) {
    return (
        <>
            <section className={`grid-item ${loading !== true ? '' : 'skeleton'}`} id="views">
                {loading !== true && (
                    <>
                        <header>
                            <h4>Views</h4>
                            <Link to={'profile/viewers'}>
                                <i className="fa-solid fa-arrow-right"></i>
                            </Link>
                        </header>
                            <img src="/public/media/pexels-kampus-6605421.jpg" alt="" />
                            <img src="/public/media/pexels-moose-photos-170195-1587009.jpg" alt="" />
                            <img src="/public/media/pexels-tima-miroshnichenko-6694958.jpg" alt="" />
                        <div>
                            <div className="count">
                                <h1>100</h1>
                                <div className="percentage-change">
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