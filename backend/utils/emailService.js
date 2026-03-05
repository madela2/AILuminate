import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configure transporter for development
let transporter;

// Check if we're in production with real email service or development with testing account
if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    // Use real email settings from .env
    transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
} else {
    // In development, log emails to console
    console.log('Email service running in development mode - emails will be logged to console');
    transporter = {
        sendMail: (options) => {
            console.log('--------------------------------');
            console.log('Email sent:');
            console.log('To:', options.to);
            console.log('Subject:', options.subject);
            console.log('Content:', options.html || options.text);
            console.log('--------------------------------');
            return Promise.resolve({ messageId: `dev-${Date.now()}` });
        }
    };
}

// Send verification email
export const sendVerificationEmail = async (to, username, verificationToken) => {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${verificationToken}`;
    
    const mailOptions = {
        from: `"Ailuminate" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Verify your email address',
        html: `
            <h1>Email Verification</h1>
            <p>Hello ${username},</p>
            <p>Thank you for registering with Ailuminate. Please verify your email address by clicking the button below:</p>
            <p>
                <a href="${verificationUrl}" style="display:inline-block;padding:10px 20px;background-color:#3498db;color:white;text-decoration:none;border-radius:5px;">
                    Verify Email
                </a>
            </p>
            <p>This link is valid for 15 minutes only.</p>
            <p>If you did not register for an account, please ignore this email.</p>
        `
    };
    
    await transporter.sendMail(mailOptions);
};

// Send researcher approval email
export const sendResearcherApprovalEmail = async (to, username) => {
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;

       const mailOptions = {
        from: `"Ailuminate" <${process.env.EMAIL_USER || 'noreply@ailuminate.com'}>`,
        to,
        subject: 'Your Researcher Account is Approved!',
        html: `
            <h1>Congratulations, ${username}!</h1>
            <p>Your request to become a researcher at Ailuminate has been approved.</p>
            <p>You can now log in with your email and password to access your researcher dashboard.</p>
            <p>
                <a href="${loginUrl}" style="display:inline-block;padding:10px 20px;background-color:#3498db;color:white;text-decoration:none;border-radius:5px;">
                    Log in now
                </a>
            </p>
            <p>Thank you for joining our research team. We look forward to your contributions!</p>
        `
    };

    await transporter.sendMail(mailOptions);
}

// Send password reset email
export const sendPasswordResetEmail = async (to, username, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    
    const mailOptions = {
        from: process.env.EMAIL_FROM || 'ailuminate@ailuminate.com',
        to,
        subject: 'Reset your password',
        html: `
            <h1>Password Reset Request</h1>
            <p>Hello ${username},</p>
            <p>You requested to reset your password. Click the button below to set a new password:</p>
            <p>
                <a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background-color:#3498db;color:white;text-decoration:none;border-radius:5px;">
                    Reset Password
                </a>
            </p>
            <p>This link is valid for 15 minutes only.</p>
            <p>If you did not request a password reset, please ignore this email.</p>
        `
    };
    
    await transporter.sendMail(mailOptions);
};

// Send quiz results email
export const sendQuizResults = async (to, quizTitle, score, totalQuestions, feedback) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@ailiteracy.app',
        to,
        subject: `Your AI Literacy Quiz Results: ${quizTitle}`,
        html: `
            <h1>Your Quiz Results</h1>
            <p>Quiz: <strong>${quizTitle}</strong></p>
            <p>Score: <strong>${score}/${totalQuestions}</strong></p>
            <h2>Feedback and Explanations</h2>
            ${feedback}
            <p>Thank you for participating in our AI Literacy and Awareness Game!</p>
        `
    };
    
    await transporter.sendMail(mailOptions);
};

export const sendSupportMessageEmail = async (name, email, subject, message) =>{
    const supportEmail = process.env.SUPPORT_EMAIL || 'support@ailuminate.com';

    const mailOptions ={
        from: `'Support Contact Form' <${process.env.EMAIL_USER}>`,
        to: supportEmail,
        subject: `New Request: ${subject}, from ${name}`,
        html: `
            <h1>New Inquiry</h1>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong><br/>${message.replace(/\n/g, '<br/>')}</p>
    `,
    };

    await transporter.sendMail(mailOptions);
};

