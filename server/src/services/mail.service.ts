import { injectable, inject } from "inversify";
import nodemailer from "nodemailer";
import { createTransporter } from "../config/mail"; 
import { EmailTemplateService, EmailTemplate } from "../utils/templates";
import { apiLogger } from "../utils/logger";
import TYPES from "../di/types";

export interface IMailService {
  sendEmail(to: string, templateType: string, context: any): Promise<void>;
  sendOtpEmail(to: string, otp: string): Promise<void>;
  sendPasswordResetEmail(to: string, resetUrl: string): Promise<void>;
  sendWelcomeEmail(to: string, name: string): Promise<void>;
}

/**
 * This is a service responsible for sending emails using nodemailer
 * It uses EmailTemplateService to get the email template and send it using nodemailer
 * It handles sending OTP, password reset, and welcome emails
 */
@injectable()
export class MailService implements IMailService {
  private transporter: nodemailer.Transporter;
  private templateService: EmailTemplateService;

  constructor(@inject(TYPES.IEmailTemplateService) templateService: EmailTemplateService) {
    this.transporter = createTransporter();
    this.templateService = templateService;
  }

  /**
   * This method sends an email using nodemailer
   * @param to - recipient email address
   * @param templateType - type of email template to use
   * @param context - context for the email template
   */
  async sendEmail(to: string, templateType: string, context: any): Promise<void> {
    try {
      const template = this.templateService.getTemplate(templateType as any, context);
      await this.transporter.sendMail({
        from: `"Platform Service" <${process.env.EMAIL_USER}>`,
        to,
        subject: template.subject,
        text: template.text,
      });
      apiLogger.info("Email sent", { to, templateType });
    } catch (error: any) {
      apiLogger.error("Email sending failed", { to, templateType, error: error.message });
      throw new Error(`Failed to send ${templateType} email`);
    }
  }

  /**
   * This method sends an OTP email to the user
   * @param to - recipient email address
   * @param otp - OTP code to be sent
   */
  async sendOtpEmail(to: string, otp: string): Promise<void> {
    await this.sendEmail(to, "otp", { otp, expiresIn: 2 });
  }

  /**
   * This method sends a password reset email to the user
   * @param to - recipient email address
   * @param resetUrl - URL for password reset
   */
  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    await this.sendEmail(to, "passwordReset", { resetUrl });
  }

  /**
   * This method sends a welcome email to the user
   * @param to - recipient email address
   * @param name - name of the user
   */

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    await this.sendEmail(to, "welcome", { name });
  }
}