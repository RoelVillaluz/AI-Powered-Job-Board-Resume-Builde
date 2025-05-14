function WelcomeSection({ selectedRole }) {
    return (
        <section className="welcome-section">
            <header>
                <h3>Welcome aboard!</h3>
                <p>
                    {selectedRole === 'jobseeker'
                        ? 'You’re all set! Your profile is ready, and employers can now discover your skills and experience'
                        : 'Great job! Your company profile is set up, and you’re now ready to connect with top talent.'
                    }
                </p>
            </header>
            <i className="fa-solid fa-hands-clapping" id="welcome-icon"></i>
        </section>
    )
}

export default WelcomeSection