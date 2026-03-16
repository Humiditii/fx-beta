import { Injectable, ConflictException, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { hash, compare, genSalt } from 'bcrypt';
import { AuthRepository } from './auth.repository';
import { EmailService } from '../email/email.service';
import { SignupDto, SignInDto, VerifyOtpDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import { User } from '../database/entities/user.entity';
import { Wallet } from '../database/entities/wallet.entity';
import { DataSource } from 'typeorm';
import { Currency, Role, JwtPayloadI } from 'src/common/interface/main.interface';
import { generateRandomNumber } from 'src/common/util/helpers.utils';
import { getCurrentDateUTC, manipulateDate, isExpired } from 'src/common/util/date-fns.utils';
import { AppResponse } from 'src/common/appRespose.parser';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepo: AuthRepository,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  private resHandler = AppResponse;

  async signUp(dto: SignupDto): Promise<any> {
    try {
      const existingUser = await this.authRepo.findByEmail(dto.email);
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      const hashedPassword = await hash(dto.password, await genSalt());
      const otpCode = generateRandomNumber(6);
      const otpExpiry = manipulateDate(getCurrentDateUTC(), 30, 'minutes', 'add');

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Create user
        const user = queryRunner.manager.create(User, {
          ...dto,
          password: hashedPassword,
          otpCode,
          otpExpiry,
          role: Role.User,
        });
        const savedUser = await queryRunner.manager.save(user);

        // Create initial NGN wallet
        const wallet = queryRunner.manager.create(Wallet, {
          userId: savedUser.id,
          currency: Currency.NGN,
          balance: 0,
        });
        await queryRunner.manager.save(wallet);

        await queryRunner.commitTransaction();

        // Send OTP email (async)
        this.emailService.sendOtpEmail(savedUser.email, otpCode, savedUser.firstName);

        const responseData = { ...savedUser };
        delete responseData.password;
        delete responseData.otpCode;
        delete responseData.otpExpiry;

        return responseData;
      } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      error.location = 'AuthService.signUp';
      this.resHandler.error(error);
    }
  }

  async signIn(dto: SignInDto): Promise<any> {
    try {
      const user = await this.authRepo.findByEmailWithPassword(dto.email);
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }

      const isPasswordValid = await compare(dto.password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!user.isVerified) {
        // Resend OTP if not verified
        const otpCode = generateRandomNumber(6);
        const otpExpiry = manipulateDate(getCurrentDateUTC(), 30, 'minutes', 'add');
        await this.authRepo.updateUser(user.id, { otpCode, otpExpiry });
        this.emailService.sendOtpEmail(user.email, otpCode, user.firstName);

        throw new BadRequestException('Email not verified. A new OTP has been sent to your email.');
      }

      const payload: JwtPayloadI = {
        userId: user.id,
        userRole: user.role,
      };

      return {
        accessToken: await this.jwtService.signAsync(payload),
      };
    } catch (error) {
      error.location = 'AuthService.signIn';
      this.resHandler.error(error);
    }
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<any> {
    try {
      const user = await this.authRepo.findByEmailWithOtp(dto.email);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.otpCode !== dto.otpCode || isExpired(user.otpExpiry)) {
        throw new BadRequestException('Invalid or expired OTP');
      }

      await this.authRepo.updateUser(user.id, {
        isVerified: true,
        otpCode: null,
        otpExpiry: null,
      });

      return { message: 'Email verified successfully' };
    } catch (error) {
      error.location = 'AuthService.verifyOtp';
      this.resHandler.error(error);
    }
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    try {
      const user = await this.authRepo.findByEmail(dto.email);
      if (!user) return; // Silent fail for security

      const otpCode = generateRandomNumber(6);
      const otpExpiry = manipulateDate(getCurrentDateUTC(), 30, 'minutes', 'add');

      await this.authRepo.updateUser(user.id, { otpCode, otpExpiry });
      this.emailService.sendOtpEmail(user.email, otpCode, user.firstName);
    } catch (error) {
      error.location = 'AuthService.forgotPassword';
      this.resHandler.error(error);
    }
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    try {
      const user = await this.authRepo.findByEmailWithOtp(dto.email);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.otpCode !== dto.otpCode || isExpired(user.otpExpiry)) {
        throw new BadRequestException('Invalid or expired OTP');
      }

      const hashedPassword = await hash(dto.newPassword, await genSalt());
      await this.authRepo.updateUser(user.id, {
        password: hashedPassword,
        otpCode: null,
        otpExpiry: null,
        isVerified: true, // Auto-verify if they reset via OTP
      });
    } catch (error) {
      error.location = 'AuthService.resetPassword';
      this.resHandler.error(error);
    }
  }

  async resendOtp(email: string): Promise<void> {
    try {
      const user = await this.authRepo.findByEmail(email);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const otpCode = generateRandomNumber(6);
      const otpExpiry = manipulateDate(getCurrentDateUTC(), 30, 'minutes', 'add');

      await this.authRepo.updateUser(user.id, { otpCode, otpExpiry });
      this.emailService.sendOtpEmail(user.email, otpCode, user.firstName);
    } catch (error) {
      error.location = 'AuthService.resendOtp';
      this.resHandler.error(error);
    }
  }

  async getProfile(userId: string): Promise<User> {
    try {
      const user = await this.authRepo.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (error) {
      error.location = 'AuthService.getProfile';
      this.resHandler.error(error);
    }
  }
}
