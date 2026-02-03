import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import VerifyUser from "../components/VerifyUser";
import { BASE_API_URL } from "../config/api";

function Register() {
    const [errorMessage, setErrorMessage] = useState(null);

    const [formData, setFormData] = useState({
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        confirmPassword: '',
    });

    const [verificationCode, setVerificationCode] = useState('');
    const [isEmailSent, setIsEmailSent] = useState(false);

    useEffect(() => {
        document.title = 'Create an account';
    }, []);

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage(null);

        if (formData.password !== formData.confirmPassword) {
            setErrorMessage('Passwords must match');
            return;
        }

        try {
            const { data } = await axios.post(
                `${BASE_API_URL}/users`,
                formData
            );

            setVerificationCode(data?.data?.verificationCode || '');
            setIsEmailSent(true);
        } catch (error) {
            console.error('Register error:', error);
            setErrorMessage(
                error.response?.data?.formattedMessage ||
                'Registration failed. Please try again.'
            );
        }
    };

    return (
        <>
            <div className="form-container" id="authentication-form-container">
                <form id="register-form" onSubmit={handleFormSubmit}>
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
                        <input type="text" onChange={handleChange} name="email" value={formData.email} placeholder="Enter your email" />
                    </div>
                    <div className="row" style={{ alignItems: 'center', gap: '0.75rem', width: '100%' }}>
                        <div className="form-group" style={{ flex: '1' }}>
                            <input type="text" onChange={handleChange} name="firstName" value={formData.firstName} placeholder="Enter your first name" />
                        </div>
                        <div className="form-group" style={{ flex: '1' }}>
                            <input type="text" onChange={handleChange} name="lastName" value={formData.lastName} placeholder="Enter your last name" />
                        </div>
                    </div>
                    <div className="form-group">
                        <input type="password" onChange={handleChange} name="password" value={formData.password} placeholder="Create a password" />
                    </div>
                    <div className="form-group">
                        <input type="password" onChange={handleChange} name="confirmPassword" value={formData.confirmPassword} placeholder="Confirm password" />
                        <span>* Password must be at least 8 characters</span>
                        {errorMessage && (
                            <span className="error-message">{errorMessage}</span>
                        )}
                    </div>

                    <button type="submit">Create account</button>
                    <span id="sign-in-link-span">Already have an account? <Link to={'/sign-in'}>Sign-in instead</Link></span>

                </form>
                <figure className="authentication-form-image-container">
                    <img src="public/media/pexels-a-darmel-8133869.jpg" alt="" />
                    <span className="testimonial">"This platform has helped me land my dream job!" - Jomar E.</span>
                    <span className="testimonial">"I love how user-friendly the interface is." - Prince O.</span>
                </figure>
            </div>
            {isEmailSent && (
                <VerifyUser email={formData.email} password={formData.password} verificationCode={verificationCode} verificationType={"register"}/>
            )}
        </>
    );
}

export default Register;