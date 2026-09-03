import nodemailer from 'nodemailer';

let transporter;

const createTransporter = async () => {
  if (transporter) return transporter;

  // Use SMTP settings if provided (production)
  if (process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Fallback to Ethereal (development)
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });
    console.log(`\n📧 Development Email Server Initialized! Ethereal User: ${testAccount.user}\n`);
  }
  return transporter;
};

export const sendInvitationEmail = async (toEmail, role, inviteUrl) => {
  if (process.env.NODE_ENV === 'test') {
    return true; // Skip actual email in tests
  }

  try {
    const tp = await createTransporter();

    const mailOptions = {
      from: '"PeopleStrat System" <no-reply@peoplestrat.com>',
      to: toEmail,
      subject: `You have been invited to join PeopleStrat as a ${role}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #3b82f6; text-align: center;">Welcome to PeopleStrat</h2>
          <p>Hello,</p>
          <p>You have been invited to join the PeopleStrat platform as a <strong>${role}</strong>.</p>
          <p>Please click the button below to register your account and set up your password.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Complete Registration</a>
          </div>
          <p style="color: #64748b; font-size: 12px; text-align: center;">This link will expire in 24 hours.</p>
          <p style="color: #64748b; font-size: 12px; text-align: center;">If the button does not work, copy and paste this URL into your browser: <br/>${inviteUrl}</p>
        </div>
      `,
    };

    const info = await tp.sendMail(mailOptions);
    
    // In development mode, log the URL to preview the email
    if (info.messageId && !process.env.SMTP_HOST) {
      console.log(`\n📬 INVITATION SENT! Preview URL: ${nodemailer.getTestMessageUrl(info)}\n`);
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send failed:', error);
    return { success: false, error: error.message };
  }
};
