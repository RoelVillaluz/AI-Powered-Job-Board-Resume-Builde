import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

function SignIn() {
    const [formData, setFormData] = useState({
        name: '',
        password: ''
    })

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    useEffect(() => {
        document.title = 'Sign In'
    }, [])

    return (
        <>
            <div className="form-container" id="authentication-form-container">
                <figure className="authentication-form-image-container">
                    <img src="public/media/pexels-olly-927022.jpg" alt="" />
                </figure>
                <form id="sign-in-form">
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
                        <input type="text" onChange={handleChange} name="name" value={formData.name} placeholder="Enter your Username" />
                    </div>
                    <div className="form-group">
                        <input type="password" onChange={handleChange} name="password" value={formData.password} placeholder="Enter your password" />
                    </div>

                    <button type="submit">Sign In</button>
                    <span id="sign-in-link-span">Don't have an account yet? <Link to={'/register'}>Create an account now!</Link></span>

                </form>
            </div>
        </>
    )
}

export default SignIn