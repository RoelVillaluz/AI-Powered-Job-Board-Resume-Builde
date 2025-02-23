import { useState, useEffect } from "react";
import { useData } from "../DataProvider";
import axios from "axios";
import Layout from "../components/Layout";
import VerifyUser from "../components/VerifyUser";
import { Link } from "react-router-dom";

function Register() {
    const { baseUrl, setSuccess, setError, setSuccessMessage } = useData();
    const [errorMessage, setErrorMessage] = useState(null)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        role: 'jobseeker',
    });
    const [verificationCode, setVerificationCode] = useState(''); // Store the verification code
    const [isEmailSent, setIsEmailSent] = useState(false); // To check if the email was sent
    const [isFormSubmitted, setIsFormSubmitted] = useState(false);

    useEffect(() => {
        document.title = 'Create an account';
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        console.log(formData);

        if (formData.password !== formData.confirmPassword) {
            setError(true)
            setErrorMessage('Passwords must match');
            setSuccess(false);
            return;
        }

        try {
            const response = await axios.post(`${baseUrl}/users`, formData);
            console.log('Backend response:', response.data); // Log the backend response

            setError(false);
            setErrorMessage(null)
            setIsEmailSent(true);
            setVerificationCode(response.data?.data?.verificationCode || ''); // Handle undefined verificationCode
            setIsFormSubmitted(true);
        } catch (error) {
            console.error('Error', error);
            setSuccess(false);
            setError(true);
            setErrorMessage(error.response?.data?.formattedMessage);
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
                <VerifyUser email={formData.email} password={formData.password} verificationCode={verificationCode} />
            )}
        </>
    );
}

export default Register;
