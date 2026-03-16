import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { DataSource, QueryRunner } from 'typeorm';
import { FxService } from '../fx/fx.service';
import { Currency, StatusEnum } from 'src/common/interface/main.interface';
import { Wallet } from '../database/entities/wallet.entity';
import { Transaction, TransactionType } from '../database/entities/transaction.entity';
import { LedgerEntry, EntryType } from '../database/entities/ledger-entry.entity';
import { TransactionStatusLog } from '../database/entities/transaction-status-log.entity';
import { BadRequestException } from '@nestjs/common';
import { AppException } from 'src/common/appRespose.parser';
import { AUTH_CONSTANTS } from 'src/common/constants/auth.constants';

describe('WalletService', () => {
  let service: WalletService;
  let dataSource: DataSource;
  let fxService: FxService;
  let queryRunner: QueryRunner;

  const mockManager = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: mockManager,
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
            getRepository: jest.fn().mockReturnValue({
              findOne: jest.fn(),
              save: jest.fn(),
            }),
          },
        },
        {
          provide: FxService,
          useValue: {
            getRate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    dataSource = module.get<DataSource>(DataSource);
    fxService = module.get<FxService>(FxService);
    queryRunner = mockQueryRunner;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fundWallet', () => {
    it('should fund a wallet and create ledger entries with system pool debit', async () => {
      const userId = 'user-1';
      const currency = Currency.NGN;
      const amount = 1000;
      
      const userWallet = { id: 'w-user', userId, currency, balance: 0 };
      const systemWallet = { id: 'w-sys', userId: AUTH_CONSTANTS.SYSTEM_USER_ID, currency, balance: 0, isSystem: true };
      const transaction = { id: 't-1' };

      // Mock idempotency check (not found)
      mockManager.findOne.mockResolvedValueOnce(null);
      // Mock user wallet find
      mockManager.findOne.mockResolvedValueOnce(userWallet);
      // Mock system wallet find
      mockManager.findOne.mockResolvedValueOnce(systemWallet);
      
      mockManager.create.mockImplementation((cls, data) => ({ id: 'mock-id', ...data }));
      mockManager.save.mockImplementation((entity) => {
        if (Array.isArray(entity)) return Promise.resolve(entity);
        return Promise.resolve({ id: 'mock-id', ...entity });
      });

      const result = await service.fundWallet(userId, currency, amount, 'idemp-1');

      expect(queryRunner.startTransaction).toHaveBeenCalledWith('SERIALIZABLE');
      expect(mockManager.save).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(result.toAmount).toBe(amount);
    });

    it('should return existing transaction for valid idempotency key', async () => {
      const existingTx = { id: 't-exist', idempotencyKey: 'key-1' };
      mockManager.findOne.mockResolvedValueOnce(existingTx);

      const result = await service.fundWallet('u1', Currency.NGN, 100, 'key-1');

      expect(result).toEqual(existingTx);
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('convertCurrency', () => {
    it('should debit source and credit target with status logs', async () => {
      const userId = 'user-1';
      const fromAmount = 100;
      const rate = 1.5;

      const sourceWallet = { id: 'w-src', userId, currency: Currency.USD, balance: 200 };
      const targetWallet = { id: 'w-tar', userId, currency: Currency.NGN, balance: 0 };

      fxService.getRate = jest.fn().mockResolvedValue(rate);
      
      // Idempotency check
      mockManager.findOne.mockResolvedValueOnce(null);
      // Source wallet lock
      mockManager.findOne.mockResolvedValueOnce(sourceWallet);
      // Target wallet lock
      mockManager.findOne.mockResolvedValueOnce(targetWallet);

      mockManager.create.mockImplementation((cls, data) => ({ id: 'mock-id', ...data }));
      mockManager.save.mockImplementation((entity) => {
        if (Array.isArray(entity)) return Promise.resolve(entity);
        return Promise.resolve({ id: 'mock-id', ...entity });
      });

      const result = await service.convertCurrency(userId, Currency.USD, Currency.NGN, fromAmount, 'idemp-2');

      expect(result.fromAmount).toBe(fromAmount);
      expect(sourceWallet.balance).toBe(100);
      expect(targetWallet.balance).toBe(150);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });
  });
});
