import { useEffect, useState } from "react"
import { useData } from "../DataProvider"
    const { baseUrl } = useData();
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmNewPassword: ''
    })

    const [passwordRequirements, setPasswordRequirements] = useState({
        '8 characters minimum': false,
        'One uppercase character': false,
        'One number': false
    })

    const checkRequirements = (password = formData.newPassword) => {
        const requirements = {
            '8 characters minimum': password.length >= 8,
            'One uppercase character': /[A-Z]/.test(password),
            'One number': /\d/.test(password)
        }

        setPasswordRequirements(requirements)
    }

    const handleFormSubmit = async () => {
        try {
            const response = await axios.patch(`${baseUrl}/users/change-password`, {
                email: email,
                newPassword: formData.password
            })

            console.log(response.data)
        } catch (error) {
            console.error('Error: ', error)
        }
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }
    useEffect(() => {
        console.log('Form Data: ', formData)
    }, [formData])

    useEffect(() => {
        checkRequirements()
    }, [formData.newPassword])

    return (
        <div className="form-container" id="authentication-form-container">

            

            <form action="" id="change-password-form">
                <header>
                    <h1>Change your password</h1>
                </header>

                <div className="form-group">
                    <input type="password" name='newPassword' placeholder="New password" onChange={(e) => handleChange(e)}/>
                </div>
                <div className="form-group">
                    <input type="password" name='confirmNewPassword' placeholder="Confirm new password" onChange={(e) => handleChange(e)}/>
                </div>

                <div className="password-requirements">
                    <h5>Password must contain at least: </h5>
                    <ul className="password-requirements">
                        {Object.entries(passwordRequirements).map(([req, valid]) => (
                            <li key={req} className={valid ? 'valid': ''}>{req}</li>
                        ))}
                    </ul>
                </div>
            </form>

        </div>
    )
}

export default ChangePasswordForm