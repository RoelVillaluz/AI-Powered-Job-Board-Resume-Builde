import { useState } from "react";
import { useAuthStore } from "../stores/authStore"
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BASE_API_URL } from "../config/api";

const VerifyUser = ({ email, password = null, verificationCode, verificationType }) => {
    const [enteredCode, setEnteredCode] = useState(['', '', '', '', '', '']);
    const [localVerificationCode, setLocalVerificationCode] = useState(verificationCode); // Track verification code locally
    const [errorMessage, setErrorMessage] = useState(null)
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const login = useAuthStore(state => state.login);

    const navigate = useNavigate();

    const handleInputChange = (e, index) => {
        const value = e.target.value;
        if (value.match(/[0-9]/)) {
            // Update the enteredCode state with the new value
            const updatedCode = [...enteredCode];
            updatedCode[index] = value;
            setEnteredCode(updatedCode);

            // Update the local verification code
            setLocalVerificationCode(updatedCode.join(''));

            // Focus next input if value is entered
            if (index < 5) {
                document.getElementById(`digit-input-${index + 1}`).focus();
            }
        }
    };

    const handleResendCode = async () => {
        try {
            const response = await axios.post(`${baseUrl}/auth/resend-verification-code`, {
                email
            })
            console.log('Resent Code successfully', response.data.data )
        } catch (error) {
            console.error('Error', error)
        }
    }

    const handleVerification = async (e) => {
        e.preventDefault();
        if (!email || !localVerificationCode) {
            console.error("Invalid verification attempt!");
            return;
        }
    
        setIsLoading(true);
        setErrorMessage(null);
    
        try {
            setIsSuccess(true);

            // Verify user
            const verificationResponse = await axios.post(`${BASE_API_URL}/auth/verify`, { 
                email, verificationCode: 
                localVerificationCode,
                verificationType: verificationType
            });

            console.log('Verification successful:', verificationResponse.data);
    
            if (verificationType === "register") {
                // Login user
                const result = await login(email, password);

                if (result.success) {
                    navigate('/get-started');
                } else {
                    setErrorMessage(result.message);
                }
        
                navigate('/get-started');
            }

            if (verificationType === 'password_reset') {
                // check if response is success then redirect
                if (verificationResponse.data.success) {
                    navigate('/change-password', {
                        state: { email: email },
                    })
                }
            }

        } catch (error) {
            console.error('Error during verification:', error.response?.data || error.message);
            setErrorMessage(error.response?.data?.formattedMessage);
            setIsSuccess(false);
        } finally {
            setIsLoading(false);
        }
    };
    

    const handleBackspace = (e, index) => {
        if (e.key === 'Backspace') {
            const updatedCode = [...enteredCode];
            updatedCode[index] = '';  // Clear the current input field
            if (index > 0) {
                document.getElementById(`digit-input-${index - 1}`).focus();
            }
            setEnteredCode(updatedCode);
        }
    };

    return (
        <div className="blurry-overlay">
            <form className="verification-form" onSubmit={handleVerification}>
                <i className="fa-solid fa-xmark" id="close-modal-btn"></i>
                <h2>Enter verification code</h2>
                <p>Enter the 6-digit code sent to <b>{email}</b></p>
                <div className="digit-container">
                    {enteredCode.map((value, index) => (
                        <input
                            key={index}
                            type="text"
                            maxLength="1"
                            className={`digit ${value ? 'filled' : ''}`}
                            value={value}
                            onChange={(e) => handleInputChange(e, index)}
                            onKeyDown={(e) => handleBackspace(e, index)}
                            id={`digit-input-${index}`}
                        />
                    ))}
                    <input type="hidden" name="email" value={email} />
                </div>
                <div className="line"></div>
                <div className="actions">
                    {errorMessage !== null && (
                        <span className="error-message">
                            {errorMessage}
                            <i className="fa-solid fa-xmark"></i>
                        </span>
                    )}
                    <div className="buttons">
                        <button type="button" className="resend-code-btn" onClick={handleResendCode}>Resend Code</button>
                        <button type="submit" className="verify-btn" disabled={isLoading}>
                            {isLoading ? (
                                <div className="spinner"></div>
                            ) : (
                                'Verify'
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default VerifyUser;
