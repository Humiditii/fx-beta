import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

import { AppResponse } from 'src/common/appRespose.parser';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);
  private resHandler = AppResponse;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get('GMAIL_USER'),
        pass: this.configService.get('GMAIL_APP_PASSWORD'),
      },
    });
  }

  async sendMail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"${this.configService.get('EMAIL_FROM_NAME', 'FX Trading App')}" <${this.configService.get('GMAIL_USER')}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error.stack);
      error.location = 'EmailService.sendMail';
      this.resHandler.error(error);
    }
  }

  async sendOtpEmail(to: string, otp: string, firstName: string): Promise<void> {
    try {
      const subject = 'Your Verification Code';
      const html = `
        <h1>Hello ${firstName},</h1>
        <p>Your verification code for FX Trading App is:</p>
        <h2 style="color: #4A90E2; font-size: 32px; letter-spacing: 5px;">${otp}</h2>
        <p>This code will expire in 30 minutes.</p>
      `;
      return this.sendMail(to, subject, html);
    } catch (error) {
      error.location = 'EmailService.sendOtpEmail';
      this.resHandler.error(error);
    }
  }
}
