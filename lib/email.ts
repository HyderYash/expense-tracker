import nodemailer from "nodemailer";

// Create reusable transporter
const createTransporter = () => {
  const email = process.env.GMAIL_EMAIL;
  const password = process.env.GMAIL_APP_PASSWORD;

  if (!email || !password) {
    throw new Error("Gmail credentials not configured. Please set GMAIL_EMAIL and GMAIL_APP_PASSWORD in .env");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: email,
      pass: password,
    },
  });
};

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.GMAIL_EMAIL,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("Error sending email:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

export async function send2FACode(email: string, code: string, name: string) {
  const subject = "Your Two-Factor Authentication Code";
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>2FA Code</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Investment Tracker</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
          <h2 style="color: #333; margin-top: 0;">Two-Factor Authentication</h2>
          <p>Hello ${name},</p>
          <p>You've requested a two-factor authentication code. Use the code below to complete your login:</p>
          <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #667eea; font-size: 36px; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">${code}</h1>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email or contact support if you have concerns.</p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </body>
    </html>
  `;

  return sendEmail(email, subject, html);
}

export async function sendEmailVerificationCode(email: string, code: string, name: string) {
  const subject = "Verify Your New Email Address";
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Investment Tracker</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
          <h2 style="color: #333; margin-top: 0;">Email Verification</h2>
          <p>Hello ${name},</p>
          <p>You've requested to change your email address. Use the verification code below to confirm your new email:</p>
          <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #667eea; font-size: 36px; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">${code}</h1>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 30 minutes.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this email change, please ignore this email or contact support immediately.</p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </body>
    </html>
  `;

  return sendEmail(email, subject, html);
}

export async function sendPasswordResetCode(email: string, code: string, name: string) {
  const subject = "Password Reset Code";
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Investment Tracker</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
          <h2 style="color: #333; margin-top: 0;">Password Reset</h2>
          <p>Hello ${name},</p>
          <p>You've requested to reset your password. Use the verification code below to reset your password:</p>
          <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #667eea; font-size: 36px; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">${code}</h1>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 30 minutes.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request a password reset, please ignore this email or contact support immediately. Your password will remain unchanged.</p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </body>
    </html>
  `;

  return sendEmail(email, subject, html);
}

