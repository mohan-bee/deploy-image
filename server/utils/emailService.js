const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// Send team invitation email
const sendTeamInvitation = async (recipientEmail, teamName, invitationToken) => {
    try {
        const transporter = createTransporter();
        const acceptUrl = `${process.env.CLIENT_URL}/accept-invitation/${invitationToken}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: recipientEmail,
            subject: `You've been invited to join ${teamName}!`,
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #0d1117; color: #ededed; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: #161b22; border: 1px solid #30363d; border-radius: 12px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #3ecf8e 0%, #38b578 100%); padding: 40px 20px; text-align: center; }
            .header h1 { color: #0d1117; margin: 0; font-size: 28px; font-weight: 700; }
            .content { padding: 40px 30px; }
            .content h2 { color: #ededed; font-size: 20px; margin-bottom: 16px; }
            .content p { color: #8b949e; line-height: 1.6; margin-bottom: 24px; }
            .team-badge { background: #3ecf8e20; border: 1px solid #3ecf8e40; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center; }
            .team-name { color: #3ecf8e; font-size: 24px; font-weight: 600; }
            .button { display: inline-block; background: #3ecf8e; color: #0d1117; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; box-shadow: 0 4px 12px rgba(62, 207, 142, 0.3); }
            .button:hover { background: #38b578; }
            .footer { background: #0d1117; padding: 20px; text-align: center; color: #484f58; font-size: 12px; border-top: 1px solid #30363d; }
            .footer a { color: #3ecf8e; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Team Invitation</h1>
            </div>
            <div class="content">
              <h2>You've been invited!</h2>
              <p>You have been invited to join an amazing team. Accept this invitation to start collaborating with your teammates.</p>
              
              <div class="team-badge">
                <div class="team-name">${teamName}</div>
              </div>
              
              <p>Click the button below to accept the invitation and join the team:</p>
              
              <div style="text-align: center;">
                <a href="${acceptUrl}" class="button">Accept Invitation</a>
              </div>
              
              <p style="font-size: 14px; color: #484f58; margin-top: 32px;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </div>
            <div class="footer">
              <p>Sent with ❤️ from your DevOps Team Platform</p>
              <p>This is an automated email, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Invitation email sent to ${recipientEmail}`);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

module.exports = {
    sendTeamInvitation
};
