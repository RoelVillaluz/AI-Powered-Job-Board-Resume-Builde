import { useEffect, useState } from "react"
import { useData } from "../DataProvider"
    const { baseUrl } = useData();
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmNewPassword: ''
    })

    return (
        <h1>Change password</h1>
    )
}

export default ChangePasswordForm