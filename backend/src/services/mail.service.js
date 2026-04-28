const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let transporter = null;

const getTransporter = () => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_PORT === '465',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }
    return transporter;
};

const sendMail = async ({ to, subject, html, text }) => {
    if (!process.env.SMTP_USER) {
        logger.warn('SMTP not configured — email not sent');
        return null;
    }

    try {
        const info = await getTransporter().sendMail({
            from: process.env.EMAIL_FROM || 'HMS System <noreply@hostel.com>',
            to,
            subject,
            html,
            text: text || html
        });
        logger.info(`Email sent: ${info.messageId} to ${to}`);
        return info;
    } catch (err) {
        logger.error(`Email failed to ${to}: ${err.message}`);
        throw err;
    }
};

const sendWelcome = (to, name) =>
    sendMail({
        to,
        subject: '🏠 Welcome to HMS — Hostel Management System',
        html: `
      <h2>Welcome, ${name}!</h2>
      <p>Your account has been created successfully. Please wait for admin verification to access full features.</p>
      <p>Navigate to the portal at <a href="${process.env.CLIENT_URL}">HMS Portal</a></p>
    `
    });

const sendVerificationUpdate = (to, name, status, remarks = '') =>
    sendMail({
        to,
        subject: `HMS — Account ${status === 'approved' ? '✅ Approved' : '❌ Rejected'}`,
        html: `
      <h2>Account Status Update</h2>
      <p>Dear ${name},</p>
      <p>Your hostel registration has been <strong>${status}</strong>.</p>
      ${remarks ? `<p>Remarks: ${remarks}</p>` : ''}
      <p>Visit the <a href="${process.env.CLIENT_URL}">HMS Portal</a> for more details.</p>
    `
    });

module.exports = { sendMail, sendWelcome, sendVerificationUpdate };
