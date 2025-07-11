import nodemailer from 'nodemailer'


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
        console.log(`Verification email sent to ${user.email}`);
    } catch (error) {
        console.error('Error sending verification email:', error);
    }
};