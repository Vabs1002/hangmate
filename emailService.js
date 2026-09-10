const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter if credentials provided
function getTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (user && pass) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '465', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass }
    });
  }
  return null;
}

function buildEmailHtml(recipient, match) {
  const instaHandle = match.insta ? `@${match.insta}` : 'Not provided';
  const instaUrl = match.insta ? `https://instagram.com/${match.insta}` : '#';

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your HangMate Match is Here! 🤙</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 20px; color: #f8fafc; }
      .container { max-width: 540px; margin: 0 auto; background: #1e293b; border-radius: 18px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.4); }
      .header { background: linear-gradient(135deg, #f43f5e 0%, #8b5cf6 50%, #3b82f6 100%); padding: 36px 24px; text-align: center; }
      .header h1 { margin: 0; font-size: 28px; color: #ffffff; letter-spacing: -0.5px; font-weight: 800; }
      .header p { margin: 6px 0 0 0; color: #f1f5f9; font-size: 14px; opacity: 0.95; }
      .body-content { padding: 28px 24px; }
      .intro { font-size: 16px; line-height: 1.5; color: #cbd5e1; margin-bottom: 24px; }
      .match-card { background: #0f172a; border-radius: 14px; border: 1px solid #334155; padding: 20px; margin-bottom: 24px; }
      .match-name { font-size: 24px; font-weight: 800; color: #fb7185; margin: 0 0 12px 0; }
      .field { margin-bottom: 12px; font-size: 14px; line-height: 1.4; }
      .field strong { color: #94a3b8; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; display: block; margin-bottom: 2px; }
      .field span { color: #f8fafc; font-weight: 500; }
      .insta-btn { display: inline-block; background: linear-gradient(135deg, #f43f5e, #ec4899); color: #ffffff !important; text-decoration: none; padding: 12px 26px; border-radius: 30px; font-weight: 700; font-size: 14px; text-align: center; margin-top: 10px; }
      .footer { border-top: 1px solid #334155; padding: 18px 24px; text-align: center; font-size: 12px; color: #64748b; }
      .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; background: #3b82f6; color: #fff; margin-right: 6px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>HangMate • IT'S A MATCH! 🤙</h1>
        <p>Your college connection is officially ready</p>
      </div>
      <div class="body-content">
        <p class="intro">Hey <strong>${recipient.name}</strong>, meet your HangMate college match! Here is their profile:</p>
        
        <div class="match-card">
          <div class="match-name">${match.name}</div>
          <div style="margin-bottom: 14px;">
            <span class="badge">${match.year || 'College Student'}</span>
            <span class="badge" style="background:#8b5cf6;">${match.personality || 'Ambivert'}</span>
          </div>

          <div class="field">
            <strong>Email Address</strong>
            <span><a href="mailto:${match.email}" style="color:#38bdf8; text-decoration:none;">${match.email}</a></span>
          </div>

          <div class="field">
            <strong>Instagram Handle</strong>
            <span>${match.insta ? `@${match.insta}` : 'Not specified'}</span>
          </div>

          ${match.phone ? `
          <div class="field">
            <strong>Phone / WhatsApp</strong>
            <span>${match.phone}</span>
          </div>` : ''}

          <div class="field">
            <strong>Music Taste 🎧</strong>
            <span>${match.musicTaste || 'Eclectic & open to everything'}</span>
          </div>

          <div class="field">
            <strong>Hobbies & Interests 🎨</strong>
            <span>${match.hobbies || 'Exploring college life & good conversations'}</span>
          </div>

          ${match.insta ? `
          <div style="text-align: center; margin-top: 20px;">
            <a href="${instaUrl}" target="_blank" class="insta-btn">Say Hi on Instagram 👋</a>
          </div>` : ''}
        </div>

        <p style="font-size: 13px; color: #94a3b8; text-align: center; margin: 0;">
          Drop them a DM or send a quick email to break the ice! Have fun! 🎉
        </p>
      </div>
      <div class="footer">
        🔒 Matchmaker Organizer Team • Have a blast!
      </div>
    </div>
  </body>
  </html>
  `;
}

async function sendMatchEmails(student1, student2) {
  const transporter = getTransporter();
  const fromEmail = process.env.FROM_EMAIL || '"HangMate" <matchmaker@hangmate.local>';

  const email1Html = buildEmailHtml(student1, student2);
  const email2Html = buildEmailHtml(student2, student1);

  if (!transporter) {
    // Simulated / Preview Mode (No SMTP credentials configured yet)
    return {
      success: true,
      mode: 'SIMULATION',
      message: 'HangMate email preview generated (Simulation mode - configure SMTP in .env to send live emails)',
      previews: [
        { to: student1.email, recipientName: student1.name, matchName: student2.name, html: email1Html },
        { to: student2.email, recipientName: student2.name, matchName: student1.name, html: email2Html }
      ]
    };
  }

  // Real Email Dispatch via SMTP
  try {
    const info1 = await transporter.sendMail({
      from: fromEmail,
      to: student1.email,
      subject: `🤙 HangMate: You've been matched with ${student2.name}!`,
      html: email1Html
    });

    const info2 = await transporter.sendMail({
      from: fromEmail,
      to: student2.email,
      subject: `🤙 HangMate: You've been matched with ${student1.name}!`,
      html: email2Html
    });

    return {
      success: true,
      mode: 'REAL_SMTP',
      message: 'Emails dispatched successfully to both participants!',
      messageIds: [info1.messageId, info2.messageId]
    };
  } catch (error) {
    console.error('Failed to send match emails:', error);
    return {
      success: false,
      mode: 'ERROR',
      error: error.message
    };
  }
}

module.exports = {
  sendMatchEmails,
  buildEmailHtml
};
