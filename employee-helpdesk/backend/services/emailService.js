const nodemailer = require('nodemailer');

let testAccount = null;

// Base email send function
const sendEmail = async (to, subject, html) => {
    try {
        let transporter;

        // If user didn't configure real email credentials, use Ethereal (fake email for testing)
        if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_email@gmail.com') {
            if (!testAccount) {
                testAccount = await nodemailer.createTestAccount();
                console.log(`[Email] Generated Ethereal Test Account: ${testAccount.user}`);
            }
            transporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            });
        } else {
            // Use real Gmail credentials
            transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
        }

        const mailOptions = {
            from: process.env.EMAIL_USER && process.env.EMAIL_USER !== 'your_email@gmail.com' 
                ? `"Employee HelpDesk" <${process.env.EMAIL_USER}>`
                : '"Employee HelpDesk (Test)" <test@helpdesk.com>',
            to,
            subject,
            html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email] Sent: ${info.messageId} → ${to}`);
        
        // If we used Ethereal, log the preview URL so you can see the email in your browser!
        if (testAccount) {
            console.log(`[Email Preview URL]: ${nodemailer.getTestMessageUrl(info)}`);
        }
    } catch (error) {
        console.error(`[Email] Failed to send to ${to}: ${error.message}`);
    }
};

// Email: Ticket Assigned
const sendTicketAssignedEmail = async (recipientEmail, recipientName, ticketTitle, ticketId) => {
    const subject = `🎫 Your ticket has been assigned - HelpDesk`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <div style="background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                <h2 style="margin: 0;">🎫 Ticket Assigned</h2>
            </div>
            <div style="padding: 24px;">
                <p style="color: #1f2937;">Hi <strong>${recipientName}</strong>,</p>
                <p style="color: #4b5563;">Your support ticket has been assigned to a support agent and is now being reviewed.</p>
                <div style="background: #f9fafb; border-left: 4px solid #10b981; padding: 16px; margin: 16px 0; border-radius: 4px;">
                    <strong style="color: #1f2937;">Ticket:</strong>
                    <p style="margin: 4px 0; color: #4b5563;">"${ticketTitle}"</p>
                </div>
                <p style="color: #4b5563;">Our support team will begin working on your issue shortly. You'll receive further updates as the status changes.</p>
                <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">— Employee HelpDesk Team</p>
            </div>
        </div>
    `;
    await sendEmail(recipientEmail, subject, html);
};

// Email: Ticket Status Update
const sendTicketStatusEmail = async (recipientEmail, recipientName, ticketTitle, newStatus) => {
    const statusColor = {
        OPEN: '#10b981',
        ASSIGNED: '#3b82f6',
        IN_PROGRESS: '#f59e0b',
        RESOLVED: '#8b5cf6',
        CLOSED: '#6b7280'
    }[newStatus] || '#6b7280';

    const subject = `🔄 Ticket status updated to ${newStatus} - HelpDesk`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <div style="background: ${statusColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                <h2 style="margin: 0;">🔄 Ticket Status Update</h2>
            </div>
            <div style="padding: 24px;">
                <p style="color: #1f2937;">Hi <strong>${recipientName}</strong>,</p>
                <p style="color: #4b5563;">The status of your support ticket has been updated.</p>
                <div style="background: #f9fafb; border-left: 4px solid ${statusColor}; padding: 16px; margin: 16px 0; border-radius: 4px;">
                    <p style="margin: 0 0 8px; color: #4b5563;"><strong>Ticket:</strong> "${ticketTitle}"</p>
                    <p style="margin: 0; color: #1f2937;"><strong>New Status:</strong> 
                        <span style="background: ${statusColor}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 13px;">${newStatus}</span>
                    </p>
                </div>
                <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">— Employee HelpDesk Team</p>
            </div>
        </div>
    `;
    await sendEmail(recipientEmail, subject, html);
};

// Email: New Comment
const sendTicketCommentEmail = async (recipientEmail, recipientName, ticketTitle, commenterName) => {
    const subject = `💬 New comment on your ticket - HelpDesk`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <div style="background: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                <h2 style="margin: 0;">💬 New Comment</h2>
            </div>
            <div style="padding: 24px;">
                <p style="color: #1f2937;">Hi <strong>${recipientName}</strong>,</p>
                <p style="color: #4b5563;"><strong>${commenterName}</strong> has added a new comment to your support ticket.</p>
                <div style="background: #f9fafb; border-left: 4px solid #3b82f6; padding: 16px; margin: 16px 0; border-radius: 4px;">
                    <strong style="color: #1f2937;">Ticket:</strong>
                    <p style="margin: 4px 0; color: #4b5563;">"${ticketTitle}"</p>
                </div>
                <p style="color: #4b5563;">Log in to your HelpDesk to view and reply to the comment.</p>
                <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">— Employee HelpDesk Team</p>
            </div>
        </div>
    `;
    await sendEmail(recipientEmail, subject, html);
};

// Email: Welcome New User
const sendWelcomeEmail = async (recipientEmail, recipientName) => {
    const subject = `👋 Welcome to Employee HelpDesk`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <div style="background: #4f46e5; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                <h2 style="margin: 0;">👋 Welcome to HelpDesk!</h2>
            </div>
            <div style="padding: 24px;">
                <p style="color: #1f2937;">Hi <strong>${recipientName}</strong>,</p>
                <p style="color: #4b5563;">Your account has been successfully created. We're excited to have you on board!</p>
                <p style="color: #4b5563;">You can now log in to the HelpDesk to submit tickets and track their status.</p>
                <div style="background: #f9fafb; border-left: 4px solid #4f46e5; padding: 16px; margin: 16px 0; border-radius: 4px;">
                    <p style="margin: 0; color: #4b5563;">If you have any IT, hardware, or software issues, our support team is ready to help.</p>
                </div>
                <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">— Employee HelpDesk Team</p>
            </div>
        </div>
    `;
    await sendEmail(recipientEmail, subject, html);
};

module.exports = {
    sendTicketAssignedEmail,
    sendTicketStatusEmail,
    sendTicketCommentEmail,
    sendWelcomeEmail
};
