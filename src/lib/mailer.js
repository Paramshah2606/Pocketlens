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

export const sendContactEmail = async (contactData) => {
  if (!process.env.EMAIL_USER) {
    console.warn('Email credentials not set. Mocking contact email send:', contactData);
    return true;
  }

  const { name, email, subject, message } = contactData;

  // 1. Email to Admin
  const adminMailOptions = {
    from: `"PocketLens Support" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER, // Admin receives it
    subject: `New Contact Inquiry: ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
        <h2 style="color: #1e293b;">New Inquiry Received</h2>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-top: 10px;">
          <p style="margin: 0; color: #475569;">${message}</p>
        </div>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">Received via PocketLens Contact Form</p>
      </div>
    `,
  };

  // 2. Confirmation to Customer
  const customerMailOptions = {
    from: `"PocketLens Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `We've received your message - PocketLens`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
        <h2 style="color: #3b82f6;">Thanks for reaching out!</h2>
        <p style="color: #475569; font-size: 16px;">Hi ${name}, we've received your inquiry regarding "<strong>${subject}</strong>".</p>
        <p style="color: #475569; font-size: 16px;">Our team will get back to you as soon as possible.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-t: 1px solid #e2e8f0;">
          <p style="font-size: 14px; color: #94a3b8;">PocketLens - Smart Expense Tracking</p>
        </div>
      </div>
    `,
  };

  try {
    await Promise.all([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(customerMailOptions)
    ]);
    return true;
  } catch (error) {
    console.error('Error sending contact emails:', error);
    return false;
  }
};
