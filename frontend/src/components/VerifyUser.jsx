import { useState } from "react";
import { useData } from "../DataProvider";
import axios from "axios";

const VerifyUser = ({ email, verificationCode }) => {
    const { baseUrl } = useData();
    const [enteredCode, setEnteredCode] = useState(['', '', '', '', '', '']);
    const [localVerificationCode, setLocalVerificationCode] = useState(verificationCode); // Track verification code locally
    const [errorMessage, setErrorMessage] = useState(null)

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
            const response = await axios.post(`${baseUrl}/users/resend-verification-code`, {
                email
            })
            console.log('Resent Code successfully', response.data.data )
        } catch (error) {
            console.error('Error', error)
        }
    }

    const handleVerification = async (e) => {
        e.preventDefault();
        const verificationCode = localVerificationCode;
        console.log("Email:", email);
        console.log("Verification Code:", verificationCode);

        if (!email || !verificationCode) {
            console.error("Invalid verification attempt!");
            return;
        }

        try {
            const response = await axios.post(`${baseUrl}/users/verify`, { email, verificationCode });
            console.log('Verification successful:', response.data);
        } catch (error) {
            console.error('Error during verification:', error.response?.data || error.message);
            setErrorMessage(error.response?.data?.formattedMessage)
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
                <div className="row" style={{ gap: '0.5rem' }} >
                    <button type="button" className="resend-code-btn" onClick={handleResendCode}>Resend Code</button>
                    <button type="submit" className="verify-btn">Verify</button>
                </div>
                {errorMessage && (
                    <span className="error-message" style={{ marginTop: '1rem' }}>{errorMessage}</span>
                )}
            </form>
        </div>
    );
};

export default VerifyUser;
