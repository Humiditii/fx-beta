export const otpEmailTemplate = (name: string, otp: string) => `
<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px; max-width: 600px; margin: auto;">
  <h2 style="color: #333;">Action Required: Verify Your Email</h2>
  <p>Hello ${name},</p>
  <p>Thank you for joining FX Trading App. Please use the following One-Time Password (OTP) to verify your email address:</p>
  <div style="font-size: 24px; font-weight: bold; color: #4A90E2; padding: 10px; border: 1px dashed #4A90E2; border-radius: 5px; text-align: center; margin: 20px 0;">
    ${otp}
  </div>
  <p>This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
  <p>Best regards,<br>The FX Trading Team</p>
</div>
`;

export const welcomeEmailTemplate = (name: string) => `
<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px; max-width: 600px; margin: auto;">
  <h2 style="color: #333;">Welcome to FX Trading App!</h2>
  <p>Hello ${name},</p>
  <p>Your account has been successfully verified. You now have access to multi-currency wallets, real-time FX trading, and secure transactions.</p>
  <p>To get started, fund your NGN wallet and explore our trading features.</p>
  <p>Best regards,<br>The FX Trading Team</p>
</div>
`;
