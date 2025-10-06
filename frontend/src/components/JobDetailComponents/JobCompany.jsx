function JobCompany({ company, loading }) {
    return (
        <section id="about-the-company">
            <h3>About the Company</h3>
            <div className="wrapper">
                <div id="company-details">
                    {!loading ? (
                        <p>{company?.description}</p>
                    ) : (
                        <div className="skeleton-text-group">
                            <div className="skeleton text max-width"></div>
                            <div className="skeleton text max-width"></div>
                            <div className="skeleton text max-width"></div>
                            <div className="skeleton text short"></div>
                        </div>
                    )}
                    <div className="row">
                        <div id="rating">
                            {!loading ? (
                                <img src={`/${company?.logo}`} alt={`${company?.name} logo`} />
                            ) : (
                                <div className="skeleton square"></div>
                            )}
                            <div style={{ marginTop: '8px' }}>
                                <h4>{!loading ? company?.name : 'Company Name'}</h4>
                                <span><i className="fa-solid fa-star"></i> {!loading ? company?.rating.toFixed(1) : '0.0'}</span>
                            </div>
                        </div>
                        {company?.ceo && (
                            <div id="ceo">
                                {!loading ? (
                                    company?.ceo.image ? (
                                        <img src={`/${company?.ceo?.image}`} alt={`${company?.name} CEO`} />
                                    ) : (
                                        <i className="fa-solid fa-user"></i>
                                    )
                                ) : (
                                    <div className="skeleton circle"></div>
                                )}
                                <div style={{ marginTop: '8px' }}>
                                    {!loading && (
                                        <h4>{company?.ceo?.name}</h4>
                                    )}
                                    <span>CEO</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                {!loading ? (
                    <div className="images">
                        {company?.images.slice(0, 3).map((image, index) => (
                            <img src={`/${image}`} key={index}></img>
                        ))}
                    </div>
                ) : (
                    <div className="skeleton rectangle"></div>
                )}
            </div>
        </section>
    )
}

export default JobCompany