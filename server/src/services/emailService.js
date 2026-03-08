import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const createTransporter = (config) => {
    return nodemailer.createTransport({
        host: config?.host || process.env.SMTP_HOST || 'smtp.hostinger.com',
        port: config?.port || process.env.SMTP_PORT || 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: config?.user || process.env.SMTP_USER,
            pass: config?.pass || process.env.SMTP_PASS,
        },
    });
};

export const sendEmail = async (to, subject, text, html, smtpConfig = null, attachments = []) => {
    try {
        const transporter = createTransporter(smtpConfig);
        const senderEmail = smtpConfig?.user || process.env.SMTP_USER;
        const senderName = smtpConfig?.fromName || process.env.SMTP_FROM_NAME || 'Triponic B2B';

        const info = await transporter.sendMail({
            from: `"${senderName}" <${senderEmail}>`, // sender address
            to, // list of receivers
            subject, // Subject line
            text, // plain text body
            html, // html body
            attachments // attachments array
        });

        console.log("Message sent: %s", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Error sending email:", error);
        return { success: false, error: error.message };
    }
};
