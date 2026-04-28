/**
 * Email service using Nodemailer with Gmail SMTP
 */

import nodemailer from 'nodemailer';

const FROM_EMAIL = 'kevinjkevps4@gmail.com';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;

    if (!user || !pass) {
      throw new Error('GMAIL_USER and GMAIL_APP_PASSWORD must be set');
    }

    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
    });
  }
  return transporter;
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getCodeExpiration(): Date {
  return new Date(Date.now() + 15 * 60 * 1000);
}

export interface SendVerificationEmailParams {
  to: string;
  name: string;
  code: string;
}

export async function sendVerificationEmail({ to, name, code }: SendVerificationEmailParams) {
  try {
    const transport = getTransporter();

    await transport.sendMail({
      from: FROM_EMAIL,
      to,
      subject: 'Verify your email - Universal Skills Hub',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #0a0a0a;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 500px;
      margin: 40px auto;
      background: #111111;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #222222;
    }
    .header {
      background: linear-gradient(135deg, #0d9488 0%, #7c3aed 100%);
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      color: white;
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }
    .content {
      padding: 40px 30px;
      text-align: center;
    }
    .code {
      font-size: 42px;
      font-weight: 800;
      color: #0d9488;
      letter-spacing: 12px;
      margin: 30px 0;
      font-family: 'SF Mono', Monaco, monospace;
    }
    .footer {
      background: #0a0a0a;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666666;
    }
    p { color: #aaaaaa; margin: 10px 0; }
    .warning { color: #f59e0b; font-size: 13px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Universal Skills Hub</h1>
    </div>
    <div class="content">
      <h2 style="color: #ffffff; margin-top: 0; font-weight: 600;">Verify your email</h2>
      <p>Hi ${name},</p>
      <p>Use the following code to verify your account:</p>
      <div class="code">${code}</div>
      <p class="warning">This code expires in 15 minutes.</p>
    </div>
    <div class="footer">
      <p>If you didn't create an account, you can safely ignore this email.</p>
    </div>
  </div>
</body>
</html>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
}
