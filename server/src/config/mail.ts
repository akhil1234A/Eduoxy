import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();



export const getSmtpConfig = ()=>({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const createTransporter = () => {
  return nodemailer.createTransport(getSmtpConfig());
};