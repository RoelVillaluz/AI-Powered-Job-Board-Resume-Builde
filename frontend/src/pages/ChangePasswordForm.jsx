import { useEffect, useState } from "react"
import { useData } from "../DataProvider"
    const { baseUrl } = useData();
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmNewPassword: ''
    })
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    return (
        <div className="form-container" id="authentication-form-container">

            

            <form action="" id="change-password-form">
                <header>
                    <h1>Change your password</h1>
                </header>

                <div className="form-group">
                    <input type="text" name='formData.newPassword' placeholder="New password" onChange={(e) => handleChange(e)}/>
                </div>
                <div className="form-group">
                    <input type="text" name='formData.confirmNewPassword' placeholder="Confirm new password" onChange={(e) => handleChange(e)}/>
                </div>

            </form>

        </div>
    )
}

export default ChangePasswordForm