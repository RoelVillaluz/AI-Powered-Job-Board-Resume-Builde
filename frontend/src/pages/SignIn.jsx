import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import VerifyUser from "../components/VerifyUser";
import { useAuthStore } from "../stores/authStore";
import { BASE_API_URL } from "../config/api";

function SignIn() {
    const navigate = useNavigate();

    const login = useAuthStore(state => state.login);

    const [errorMessage, setErrorMessage] = useState(null);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [isEmailSent, setIsEmailSent] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');

    useEffect(() => {
        document.title = 'Sign In';
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

        const result = await login(formData.email, formData.password);

        if (result.success) {
            navigate('/');
        } else {
            setErrorMessage(result.message);
        }
    };

    const handleForgotPasswordClick = async (e) => {
        try {
            // send verification code to email
            const response = await axios.post(`${BASE_API_URL}/users/resend-verification-code`, {
                email: formData.email
            })

            console.log(response.data.data);

            setIsEmailSent(true);
            setVerificationCode(response.data?.data?.verificationCode || '');
        } catch (error) {
            console.log('Error:', error);
            setErrorMessage(error.response?.data?.formattedMessage);
        }
    }

    return (
        <>
            <div className="form-container" id="authentication-form-container">
                <figure className="authentication-form-image-container">
                    <img src="public/media/pexels-olly-927022.jpg" alt="" />
                </figure>
                <form id="sign-in-form" onSubmit={handleFormSubmit}>
                    <header>
                        <h1>Welcome back!</h1>
                    </header>

                    <button className="create-with-google">
                        <img src="public/media/google-icon-1.png" alt="" />
                        Sign in with Google
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
                        <input type="password" onChange={handleChange} name="password" value={formData.password} placeholder="Enter your password" />
                    </div>

                    <button type="submit">Sign In</button>
                    <span id="sign-in-link-span">Don't have an account yet? <Link to={'/register'}>Create an account now!</Link></span>

                    <button type="button" className="forgot-password-btn" onClick={handleForgotPasswordClick}>Forgot Password?</button>

                    {errorMessage !== null && (
                        <span className="error-message">
                            {errorMessage}
                            <i className="fa-solid fa-xmark"></i>
                        </span>
                    )}
                    
                </form>
            </div>
            {isEmailSent && (
                <VerifyUser email={formData.email} verificationCode={verificationCode} verificationType={"password_reset"}/>
            )}
        </>
    )
}

export default SignIn;
