import { Link } from "react-router-dom";

function SuccessMessage({ message }) {
    return (
        <div className="success-message-container">
            <div className="success-message">
                <i className="fa-solid fa-circle-check"></i>
                <h1>Congratulations!</h1>
                <p>{message}</p>
                <Link to={'/'}>
                    Return home
                </Link>
            </div>
        </div>
    )
}

export default SuccessMessage