import { injectable } from "inversify";

export interface EmailTemplate {
  subject: string;
  text: string;
}

export type TemplateType = "otp" | "passwordReset" | "welcome";

@injectable()
export class EmailTemplateService {
  private templates: Record<TemplateType, (context: any) => EmailTemplate> = {
    otp: (context: { otp: string; expiresIn: number }) => ({
      subject: "Your OTP Code",
      text: `Your OTP code is: ${context.otp}. It expires in ${context.expiresIn} minutes.`,
    }),
    passwordReset: (context: { resetUrl: string }) => ({
      subject: "Password Reset Request",
      text: `
        To reset your password, click the link below:
        ${context.resetUrl}
        This link expires in 15 minutes. If you didn’t request this, ignore this email.
      `,
    }),
    welcome: (context: { name: string }) => ({
      subject: "Welcome to Our Platform!",
      text: `Hello ${context.name},\n\nWelcome to our platform! We're excited to have you on board.`,
    }),
  };

  public getTemplate(type: TemplateType, context: any): EmailTemplate {
    const templateFn = this.templates[type];
    if (!templateFn) {
      throw new Error(`Template ${type} not found`);
    }
    return templateFn(context);
  }

  public addTemplate(type: TemplateType, templateFn: (context: any) => EmailTemplate) {
    this.templates[type] = templateFn;
  }
}