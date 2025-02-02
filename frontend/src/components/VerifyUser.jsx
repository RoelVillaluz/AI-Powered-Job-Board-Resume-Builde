import { useState } from "react"
import { useData } from "../DataProvider"
import axios from "axios";

const VerifyUser = () => {
    const [enteredCode, setEnteredCode] = useState(['', '', '', '', '', '']);

    const handleInputChange = (e, index) => {
        const value = e.target.value;
        if (value.match(/[0-9]/)) {
            // Update the enteredCode state with the new value
            const updatedCode = [...enteredCode];
            updatedCode[index] = value;
            setEnteredCode(updatedCode);

            // Focus next input if value is entered
            if (index < 5) {
                document.getElementById(`digit-input-${index + 1}`).focus();
            }
        }
    };


    const handleBackspace = (e, index) => {
        if (e.key === 'Backspace') {
            const updatedCode = [...enteredCode];
            updatedCode[index] = '';  // Clear the current input field
            if (index > 0) {
                document.getElementById(`digit-input-${index - 1}`).focus();
            } else {
                document.getElementById(`digit-input-${index - 1}`)
            }
            setEnteredCode(updatedCode);
        }
    };

    return (
        <form className="verification-form">
            <h2>Enter verification code</h2>
            <p>{`Enter the 6-digit code sent to ${email}`}</p>
            <div className="digit-container">
                {enteredCode.map((value, index) => (
                    <input
                        key={index}
                        type="text"
                        maxLength="1"
                        className={`digit ${value ? 'filled' : ''}`}
                        value={value}
                        onChange={(e) => handleInputChange(e, index)}
                        onKeyDown={(e) => {
                            handleBackspace(e, index); // Clear input on backspace
                        }}
                        id={`digit-input-${index}`}
                    />
                ))}
            </div>
            <button className="verify-btn">Verify</button>
        </form>
    );
}

export default VerifyUser