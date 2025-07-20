import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useJobsState } from "../../contexts/JobsListContext";
import axios from "axios";

function TopCompanies({ baseUrl, user }) {
    const { loading, setLoading } = useJobsState();
    const [recommendedCompanies, setRecommendedCompanies] = useState([]);

    useEffect(() => {
        const fetchRecommendedCompanies = async () => {
            try {
                const response = await axios.get(`${baseUrl}/ai/recommend-companies/${user._id}`)

                console.log(response.data.recommended_companies)
                setRecommendedCompanies(response.data.recommended_companies)
            } catch (error) {
                console.error('Error', error)
            } finally {
                setLoading(false)
            }
        }
        fetchRecommendedCompanies()
    }, [user._id])

    return (
        <section id="top-companies">
            <header>
                <h2>Top Companies</h2>
            </header>
            <ul>
                {!loading && recommendedCompanies.map((company) => (
                    <li key={company._id}>
                        <Link to={`/companies/${company._id}`}>
                            {company.logo ? (
                                <img src={company.logo} alt="" />
                            ) : (
                                <i className="fa-solid fa-building"></i>
                            )}
                            <h4>{company.name}</h4>
                            <h5><i className="fa-solid fa-star"></i>{company.rating}.0</h5>
                        </Link>
                    </li>
                ))}
                {loading && (
                    Array.from({ length: 7 }).map((_, index) => (
                        <li key={index} className="skeleton"></li>
                    ))
                )}
            </ul>
        </section>
    )
}

export default TopCompanies