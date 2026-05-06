import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

export const sendOTP = async (email, otp) => {
  if (!process.env.EMAIL_USER) {
    console.warn('Email credentials not set. Mocking email send:', { email, otp });
    return true;
  }

  const mailOptions = {
    from: `"PocketLens" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your PocketLens Verification Code',
    text: `Your verification code is ${otp}. It will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Welcome to PocketLens!</h2>
        <p>Your verification code is:</p>
        <h1 style="font-size: 36px; letter-spacing: 5px; color: #3b82f6;">${otp}</h1>
        <p>This code will expire in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};
