import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // Use true for port 465, false for others like 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export interface IMailService {
  sendOtpEmail(to: string, otp: string, subject?: string): Promise<void>;
}

export class MailService implements IMailService {
  async sendOtpEmail(to: string, otp: string, subject: string = "Your OTP Code"): Promise<void> {
    try {
      await transporter.sendMail({
        from: `"OTP Service" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text: otp.includes("\n")
          ? otp // For multi-line bodies (e.g., password reset)
          : `Your ${subject.toLowerCase()} is: ${otp}. It expires in ${subject.includes("OTP") ? "2" : "15"} minutes.`,
      });
      console.log(`OTP email sent to ${to} with subject: ${subject}`);
    } catch (error: any) {
      console.error(`Failed to send OTP email to ${to}:`, error);
      throw new Error("Failed to send email");
    }
  }
}

export const mailService = new MailService();
export const sendOtpEmail = mailService.sendOtpEmail.bind(mailService);