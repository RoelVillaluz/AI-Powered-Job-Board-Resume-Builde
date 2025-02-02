import nodemailer from 'nodemailer'

// Helper function to check if any required field is missing
export const checkMissingFields = (fields, body) => {
    for (let field of fields) {
        if (!body[field]) {
            return field // Return the name of the first missing field
        }
    }
    return null; // All required fields are present
}   

export const sendVerificationEmail = async (user, verificationCode) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Account Verification Code',
            text: `Your verification code is ${verificationCode}`
        };

        console.log('Sending email to:', user.email);
        console.log('Verification Code:', verificationCode);

        await transporter.sendMail(mailOptions);
        console.log(`Verification email sent to ${email}`);
    } catch (error) {
        console.error('Error sending verification email:', error);
    }
};
