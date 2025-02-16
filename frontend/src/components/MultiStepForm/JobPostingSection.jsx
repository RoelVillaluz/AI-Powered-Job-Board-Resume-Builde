import { useState } from "react"

function JobPostingSection({ user }) {
    const [formData, setFormData] = useState({
        title: '',

    })

    return(
        <>
            <section className="job-posting">
                <header>
                    <h3>Post your first job</h3>
                    <p>Fill in the job details to find the perfect candidate for your position.</p>
                </header>
                <div className="form-details">

                </div>
            </section>
        </>
    )
}

export default JobPostingSection