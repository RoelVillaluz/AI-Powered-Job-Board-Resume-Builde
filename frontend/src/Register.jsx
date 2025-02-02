import { useState, useEffect } from "react";
import { useData } from "./DataProvider";
import axios from "axios";
import Layout from "./components/Layout";

function Register () {
    const { baseUrl, setSuccess, setError } = useData();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'jobseeker',
        profile_picture: null,
    })

    const handleChange = (e) => {
        setFormData({...formData, [e.target.name]: e.target.value })
    }

    const handleFormSubmit = async (e) => {
        e.preventDefault()

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords must match')
            setSuccess(false)
        }

        try {
            await axios.post(`${baseUrl}/users`)
            console.log(formData)
            setSuccess(true)
            setError(false)
        } catch (error) {
            console.error('Error', error)
            setSuccess(false)
            setError(error.response?.data?.message || "Someting went wrong")
        }
        
    }

    return(
        <>
            <div id="authentication-form-container">
                <form className="" id="register-form" onSubmit={handleFormSubmit}>

                    <header>
                        <h1>Create an account</h1>
                    </header>

                    <button className="create-with-google">
                        <img src="public/media/google-icon-1.png" alt="" />
                        Sign up with Google
                    </button>

                    <div className="row" style={{ alignItems: 'center', gap: '0.75rem' }}>
                        <div className="line"></div>
                        <span className="separator">OR</span>
                        <div className="line"></div>
                    </div>

                    <div className="form-group">
                        <input type="text" onChange={handleChange} name="name" value={formData.name} placeholder="Enter your Username"/>
                    </div>
                    <div className="form-group">
                        <input type="text" onChange={handleChange} name="email" value={formData.email} placeholder="Enter your email"/>
                    </div>
                    <div className="form-group">
                        <input type="password" onChange={handleChange} name="password" value={formData.password} placeholder="Create a password"/>
                    </div>
                    <div className="form-group">
                        <input type="password" onChange={handleChange} name="confirmPassword" value={formData.password} placeholder="Confirm password"/>
                        <span>* Must be at least 8 characters</span>
                    </div>

                    <button type="submit">Create account</button>
                    <span id="sign-in-link-span">Already have an account? <a href="">Sign-in instead</a></span>
                </form>
                <figure className="authentication-form-image-container">
                    <img src="public/media/pexels-a-darmel-8133869.jpg" alt="" />
                    <span className="testimonial">"This platform has helped me land my dream job!" - Jomar E.</span>
                    <span className="testimonial">"I love how user-friendly the interface is." - Prince O.</span>
                </figure>
            </div>
        </>
    )
}


export default Register