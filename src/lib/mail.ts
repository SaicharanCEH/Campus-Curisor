import nodemailer from 'nodemailer';

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

// Ensure environment variables are loaded
const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;

if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS) {
  console.warn(
    'Email environment variables are not set. Email functionality will be disabled.'
  );
}

const transporter =
  EMAIL_HOST && EMAIL_USER && EMAIL_PASS
    ? nodemailer.createTransport({
        host: EMAIL_HOST,
        port: Number(EMAIL_PORT),
        secure: Number(EMAIL_PORT) === 465, // true for 465, false for other ports
        auth: {
          user: EMAIL_USER,
          pass: EMAIL_PASS,
        },
      })
    : null;

export async function sendMail({ to, subject, html }: SendMailOptions): Promise<boolean> {
  if (!transporter) {
    console.error('Email transporter is not configured. Cannot send email.');
    throw new Error('Email service is not configured on the server.');
  }

  try {
    await transporter.sendMail({
      from: `"Campus Cruiser" <${EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      html, // html body
    });
    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}
