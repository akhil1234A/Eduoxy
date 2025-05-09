import { injectable } from "inversify";
import { TemplateContext } from "../types/types";

export interface EmailTemplate {
  subject: string;
  text: string;
}

export type TemplateType = "otp" | "passwordReset" | "welcome";

@injectable()
export class EmailTemplateService {
  private templates: Record<TemplateType, (context: TemplateContext) => EmailTemplate> = {
    otp: (context: TemplateContext) => {
      if ("otp" in context && "expiresIn" in context) {
        return {
          subject: "Your OTP Code",
          text: `Your OTP code is: ${context.otp}. It expires in ${context.expiresIn} minutes.`,
        };
      }
      throw new Error("Invalid context for OTP template");
    },
    passwordReset: (context: TemplateContext) => {
      if ("resetUrl" in context) {
        return {
          subject: "Password Reset Request",
          text: `
            To reset your password, click the link below:
            ${context.resetUrl}
            This link expires in 15 minutes. If you didn’t request this, ignore this email.
          `,
        };
      }
      throw new Error("Invalid context for password reset template");
    },
    welcome: (context: TemplateContext) => {
      if ("name" in context) {
        return {
          subject: "Welcome to Our Platform!",
          text: `Hello ${context.name},\n\nWelcome to our platform! We're excited to have you on board.`,
        };
      }
      throw new Error("Invalid context for welcome template");
    },
  };

  public getTemplate(type: TemplateType, context: TemplateContext): EmailTemplate {
    const templateFn = this.templates[type];
    if (!templateFn) {
      throw new Error(`Template ${type} not found`);
    }
    return templateFn(context);
  }

  public addTemplate(type: TemplateType, templateFn: (context: TemplateContext) => EmailTemplate) {
    this.templates[type] = templateFn;
  }
}