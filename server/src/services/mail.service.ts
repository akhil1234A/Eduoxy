import { inject } from "inversify";
import nodemailer from "nodemailer";
import { createTransporter } from "../config/mail";
import { EmailTemplateService, EmailTemplate, TemplateType } from "../utils/templates";
import { apiLogger } from "../utils/logger";
import TYPES from "../di/types";
import { TemplateContext } from "../types/types";




export interface IMailService {
  sendEmail(to: string, templateName: TemplateType, context: TemplateContext): Promise<void>;
  sendOtpEmail(to: string, otp: string): Promise<void>;
  sendPasswordResetEmail(to: string, resetUrl: string): Promise<void>;
  sendWelcomeEmail(to: string, name: string): Promise<void>;
}

/**
 * Service for sending emails using nodemailer.
 * Uses EmailTemplateService to get email templates and sends them via nodemailer.
 * Handles OTP, password reset, and welcome emails.
 */
export class MailService implements IMailService {
  private transporter: nodemailer.Transporter;
  private templateService: EmailTemplateService;

  constructor(@inject(TYPES.IEmailTemplateService) templateService: EmailTemplateService) {
    this.transporter = createTransporter();
    this.templateService = templateService;
  }

  /**
   * Sends an email using nodemailer.
   * @param to - Recipient email address.
   * @param templateName - Type of email template to use.
   * @param context - Context for the email template.
   */
  async sendEmail(to: string, templateName: TemplateType, context: TemplateContext): Promise<void> {
    try {
      const template = this.templateService.getTemplate(templateName, context);
      await this.transporter.sendMail({
        from: `"Platform Service" <${process.env.EMAIL_USER}>`,
        to,
        subject: template.subject,
        text: template.text,
      });
      apiLogger.info("Email sent", { to, templateName });
    } catch (error) {
      apiLogger.error("Email sending failed", { to, templateName, error: (error as Error).message });
      throw new Error(`Failed to send ${templateName} email: ${(error as Error).message}`);
    }
  }

  /**
   * Sends an OTP email to the user.
   * @param to - Recipient email address.
   * @param otp - OTP code to be sent.
   */
  async sendOtpEmail(to: string, otp: string): Promise<void> {
    await this.sendEmail(to, "otp", { otp, expiresIn: 2 });
  }

  /**
   * Sends a password reset email to the user.
   * @param to - Recipient email address.
   * @param resetUrl - URL for password reset.
   */
  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    await this.sendEmail(to, "passwordReset", { resetUrl });
  }

  /**
   * Sends a welcome email to the user.
   * @param to - Recipient email address.
   * @param name - Name of the user.
   */
  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    await this.sendEmail(to, "welcome", { name });
  }
}