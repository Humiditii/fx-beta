import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SignupDto, SignInDto, VerifyOtpDto, ForgotPasswordDto, ResetPasswordDto, ResendOtpDto } from './dto/auth.dto';

export function SwaggerSignup() {
  return applyDecorators(
    ApiOperation({ summary: 'Register a new user' }),
    ApiBody({ type: SignupDto }),
    ApiResponse({ status: 201, description: 'User registered successfully, OTP sent to email' }),
    ApiResponse({ status: 400, description: 'User already exists or invalid data' }),
  );
}

export function SwaggerVerifyOtp() {
  return applyDecorators(
    ApiOperation({ summary: 'Verify email via OTP' }),
    ApiBody({ type: VerifyOtpDto }),
    ApiResponse({ status: 200, description: 'Email verified successfully' }),
    ApiResponse({ status: 400, description: 'Invalid or expired OTP' }),
  );
}

export function SwaggerSignin() {
  return applyDecorators(
    ApiOperation({ summary: 'Login user' }),
    ApiBody({ type: SignInDto }),
    ApiResponse({ status: 200, description: 'Login successful, returns JWT token' }),
    ApiResponse({ status: 401, description: 'Invalid credentials' }),
  );
}

export function SwaggerForgotPassword() {
  return applyDecorators(
    ApiOperation({ summary: 'Request password reset OTP' }),
    ApiBody({ type: ForgotPasswordDto }),
    ApiResponse({ status: 200, description: 'OTP sent to email if user exists' }),
  );
}

export function SwaggerResetPassword() {
  return applyDecorators(
    ApiOperation({ summary: 'Reset password using OTP' }),
    ApiBody({ type: ResetPasswordDto }),
    ApiResponse({ status: 200, description: 'Password reset successful' }),
  );
}

export function SwaggerResendOtp() {
  return applyDecorators(
    ApiOperation({ summary: 'Resend verification OTP' }),
    ApiBody({ type: ResendOtpDto }),
    ApiResponse({ status: 200, description: 'OTP resent successfully' }),
  );
}

export function SwaggerGetProfile() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({ summary: 'Get current user profile' }),
    ApiResponse({ status: 200, description: 'Profile retrieved successfully' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
