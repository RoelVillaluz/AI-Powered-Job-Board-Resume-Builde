import { useState, useEffect } from "react";
import { useData } from "./DataProvider";
import axios from "axios";
import Layout from "./components/Layout";
import VerifyUser from "./components/VerifyUser";

function Register() {
    const { baseUrl, setSuccess, setError } = useData();
    const [formData, setFormData] = useState({
        name: '',
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
            setError('Passwords must match');
            setSuccess(false);
            return;
        }

        try {
            const response = await axios.post(`${baseUrl}/users`, formData);
            console.log('Backend response:', response.data); // Log the backend response

            setSuccess(true);
            setError(false);
            setIsEmailSent(true);
            setVerificationCode(response.data?.data?.verificationCode || ''); // Handle undefined verificationCode
            setIsFormSubmitted(true);
        } catch (error) {
            console.error('Error', error);
            setSuccess(false);
            setError(error.response?.data?.message || 'Something went wrong');
        }
    };

    return (
        <>
            <div id="authentication-form-container">
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
                        <input type="text" onChange={handleChange} name="name" value={formData.name} placeholder="Enter your Username" />
                    </div>
                    <div className="form-group">
                        <input type="text" onChange={handleChange} name="email" value={formData.email} placeholder="Enter your email" />
                    </div>
                    <div className="form-group">
                        <input type="password" onChange={handleChange} name="password" value={formData.password} placeholder="Create a password" />
                    </div>
                    <div className="form-group">
                        <input type="password" onChange={handleChange} name="confirmPassword" value={formData.confirmPassword} placeholder="Confirm password" />
                        <span>* Must be at least 8 characters</span>
                    </div>

                    <button type="submit">Create account</button>
                    <span id="sign-in-link-span">Already have an account? <a href="">Sign-in instead</a></span>

                    {isEmailSent && (
                        <p>Email has been sent</p>
                    )}
                </form>
                <figure className="authentication-form-image-container">
                    <img src="public/media/pexels-a-darmel-8133869.jpg" alt="" />
                    <span className="testimonial">"This platform has helped me land my dream job!" - Jomar E.</span>
                    <span className="testimonial">"I love how user-friendly the interface is." - Prince O.</span>
                </figure>
            </div>
            {isEmailSent && (
                <VerifyUser email={formData.email} verificationCode={verificationCode} />
            )}
        </>
    );
}

export default Register;
