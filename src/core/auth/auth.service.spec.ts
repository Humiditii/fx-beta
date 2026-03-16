import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { EmailService } from '../email/email.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Role, Currency } from 'src/common/interface/main.interface';
import { AppException } from 'src/common/appRespose.parser';

describe('AuthService', () => {
  let service: AuthService;
  let authRepo: any;
  let emailService: any;

  beforeEach(async () => {
    authRepo = {
      findByEmail: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      createUser: jest.fn(),
      updateUser: jest.fn(),
    };

    emailService = {
      sendOtpEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: authRepo },
        { provide: EmailService, useValue: emailService },
        { provide: JwtService, useValue: { signAsync: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue({
              connect: jest.fn(),
              startTransaction: jest.fn(),
              commitTransaction: jest.fn(),
              rollbackTransaction: jest.fn(),
              release: jest.fn(),
              manager: {
                create: jest.fn().mockReturnValue({}),
                save: jest.fn().mockResolvedValue({ id: 'u1', email: 't@t.com', firstName: 'T' }),
              },
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('signUp', () => {
    it('should throw ConflictException if user exists', async () => {
      authRepo.findByEmail.mockResolvedValue({ id: '1' });
      await expect(service.signUp({ email: 't@t.com', password: 'p', firstName: 'A', lastName: 'B' }))
        .rejects.toThrow(AppException);
    });

    it('should create user and wallet successfully', async () => {
      authRepo.findByEmail.mockResolvedValue(null);
      const result = await service.signUp({ email: 't@t.com', password: 'password123', firstName: 'A', lastName: 'B' });
      expect(result.email).toBe('t@t.com');
      expect(emailService.sendOtpEmail).toHaveBeenCalled();
    });
  });

  describe('signIn', () => {
    it('should throw UnauthorizedException for invalid credentials', async () => {
      authRepo.findByEmailWithPassword.mockResolvedValue(null);
      await expect(service.signIn({ email: 't@t.com', password: 'p' }))
        .rejects.toThrow(AppException);
    });
  });
});
