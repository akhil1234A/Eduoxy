import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOtpEmail = async (email: string, body: string, subject = "Your OTP Code") => {
  await transporter.sendMail({
    from: `"OTP Service" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    text: body.includes("\n") ? body : `Your ${subject.toLowerCase()} is: ${body}. It expires in ${subject.includes("OTP") ? "2" : "15"} minutes.`,
  });
};