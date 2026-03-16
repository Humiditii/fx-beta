import { Body, Controller, Post, Get, Req, Res, Query, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from 'src/common/guard/decorator/public.decorator';
import { SignupDto, SignInDto, VerifyOtpDto, ForgotPasswordDto, ResetPasswordDto, ResendOtpDto } from './dto/auth.dto';
import { AppResponse } from 'src/common/appRespose.parser';
import {
  SwaggerSignup,
  SwaggerSignin,
  SwaggerVerifyOtp,
  SwaggerForgotPassword,
  SwaggerResetPassword,
  SwaggerResendOtp,
  SwaggerGetProfile,
} from './auth.swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private success = AppResponse.success;

  @Public()
  @SwaggerSignup()
  @Post('register')
  async register(@Res() res: Response, @Body() dto: SignupDto): Promise<Response> {
    const data = await this.authService.signUp(dto);
    return res.status(201).json(this.success('User registered successfully', 201, data));
  }

  @Public()
  @SwaggerSignin()
  @Post('signin')
  async signin(@Res() res: Response, @Body() dto: SignInDto): Promise<Response> {
    const data = await this.authService.signIn(dto);
    return res.status(200).json(this.success('Login successful', 200, data));
  }

  @Public()
  @SwaggerVerifyOtp()
  @Post('verify')
  async verify(@Res() res: Response, @Body() dto: VerifyOtpDto): Promise<Response> {
    const data = await this.authService.verifyOtp(dto);
    return res.status(200).json(this.success('Email verified successfully', 200, data));
  }

  @Public()
  @SwaggerForgotPassword()
  @Post('forgot-password')
  async forgotPassword(@Res() res: Response, @Body() dto: ForgotPasswordDto): Promise<Response> {
    await this.authService.forgotPassword(dto);
    return res.status(200).json(this.success('If email exists, an OTP has been sent', 200));
  }

  @Public()
  @SwaggerResetPassword()
  @Post('reset-password')
  async resetPassword(@Res() res: Response, @Body() dto: ResetPasswordDto): Promise<Response> {
    await this.authService.resetPassword(dto);
    return res.status(200).json(this.success('Password reset successfully', 200));
  }

  @Public()
  @SwaggerResendOtp()
  @Post('resend-otp')
  async resendOtp(@Res() res: Response, @Body() dto: ResendOtpDto): Promise<Response> {
    await this.authService.resendOtp(dto.email);
    return res.status(200).json(this.success('OTP resent successfully', 200));
  }

  @SwaggerGetProfile()
  @Get('profile')
  async getProfile(@Res() res: Response, @Req() req: any): Promise<Response> {
    const data = await this.authService.getProfile(req.user.userId);
    return res.status(200).json(this.success('Profile retrieved successfully', 200, data));
  }
}
