require('dotenv').config();
const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, text, html }) => {
    try {
        const user = process.env.EMAIL_USER;
        const pass = process.env.EMAIL_PASS;

        if (!user || !pass) {
            console.error('Email error: EMAIL_USER or EMAIL_PASS is missing in .env');
            return null;
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user,
                pass,
            },
        });

        if (!to || (Array.isArray(to) && to.length === 0)) {
            return null;
        }

        const recipients = Array.isArray(to) ? to.join(', ') : to;

        const info = await transporter.sendMail({
            from: `"Meetly" <${user}>`,
            to: recipients,
            subject,
            text,
            html,
        });

        console.log(`Email sent successfully to ${recipients}:`, info.messageId);
        return info;
    } catch (err) {
        console.error('Error sending email:', err.message);
        return null;
    }
};

module.exports = sendEmail;
