import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { DataSource, QueryRunner, EntityManager } from 'typeorm';
import { Wallet } from '../database/entities/wallet.entity';
import { User } from '../database/entities/user.entity';
import { Transaction, TransactionType } from '../database/entities/transaction.entity';
import { LedgerEntry, EntryType } from '../database/entities/ledger-entry.entity';
import { TransactionStatusLog } from '../database/entities/transaction-status-log.entity';
import { Currency, StatusEnum, Role } from 'src/common/interface/main.interface';
import { FxService } from '../fx/fx.service';
import { generateRef } from 'src/common/util/helpers.utils';
import { AppResponse } from 'src/common/appRespose.parser';
import { AUTH_CONSTANTS } from 'src/common/constants/auth.constants';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  private resHandler = AppResponse;

  constructor(
    private readonly dataSource: DataSource,
    private readonly fxService: FxService,
  ) { }

  async getBalances(userId: string): Promise<Wallet[]> {
    try {
      return this.dataSource.getRepository(Wallet).find({
        where: { userId, isActive: true },
      });
    } catch (error) {
      error.location = 'WalletService.getBalances';
      this.resHandler.error(error);
    }
  }

  private async recordStatusTransition(
    manager: EntityManager,
    transactionId: string,
    fromStatus: StatusEnum,
    toStatus: StatusEnum,
    reason?: string,
  ) {
    const log = manager.create(TransactionStatusLog, {
      transactionId,
      fromStatus,
      toStatus,
      reason,
    });
    await manager.save(log);
  }

  private async ensureSystemUserExists(manager: EntityManager): Promise<void> {
    const systemUser = await manager.findOne(User, {
      where: { id: AUTH_CONSTANTS.SYSTEM_USER_ID },
    });

    if (!systemUser) {
      const newUser = manager.create(User, {
        id: AUTH_CONSTANTS.SYSTEM_USER_ID,
        email: 'system@fx-trading-app.local',
        password: 'SYSTEM_ACCOUNT_NO_LOGIN', // Non-null requirement
        firstName: 'System',
        lastName: 'Pool',
        role: Role.Admin,
        isVerified: true,
        isActive: true,
      });
      await manager.save(newUser);
    }
  }

  private async getOrCreateSystemWallet(manager: EntityManager, currency: Currency): Promise<Wallet> {
    let wallet = await manager.findOne(Wallet, {
      where: { isSystem: true, currency },
      lock: { mode: 'pessimistic_write' },
    });

    if (!wallet) {
      await this.ensureSystemUserExists(manager);
      wallet = manager.create(Wallet, {
        userId: AUTH_CONSTANTS.SYSTEM_USER_ID, // Identifier for system wallet
        currency,
        balance: 20000000,
        isSystem: true,
      });
      wallet = await manager.save(wallet);
    }
    return wallet;
  }

  async fundWallet(userId: string, currency: Currency, amount: number, idempotencyKey?: string): Promise<Transaction> {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    // We use REPEATABLE READ or SERIALIZABLE to ensure idempotency check is safe
    await queryRunner.startTransaction('SERIALIZABLE');

    try {
      // 1. Race-safe Idempotency Check inside transaction
      if (idempotencyKey) {
        const existingTx = await queryRunner.manager.findOne(Transaction, {
          where: { idempotencyKey },
        });
        if (existingTx) {
          await queryRunner.rollbackTransaction();
          return existingTx;
        }
      }

      // 2. Lock and Get Wallets
      const userWallet = await queryRunner.manager.findOne(Wallet, {
        where: { userId, currency },
        lock: { mode: 'pessimistic_write' },
      }) || await queryRunner.manager.save(queryRunner.manager.create(Wallet, { userId, currency, balance: 0 }));

      const systemWallet = await this.getOrCreateSystemWallet(queryRunner.manager, currency);

      const userBalanceBefore = Number(userWallet.balance);
      const systemBalanceBefore = Number(systemWallet.balance);

      // 3. Update Balances
      userWallet.balance = userBalanceBefore + Number(amount);
      systemWallet.balance = systemBalanceBefore - Number(amount); // System pool debited

      await queryRunner.manager.save(Wallet, [userWallet, systemWallet]);

      // 4. Create Transaction record
      const transaction = queryRunner.manager.create(Transaction, {
        userId,
        type: TransactionType.FUND,
        toCurrency: currency,
        fromAmount: 0,
        toAmount: amount,
        fxRate: 1,
        status: StatusEnum.COMPLETED,
        idempotencyKey,
        referenceId: generateRef('FND'),
      });
      const savedTx = await queryRunner.manager.save(transaction);

      // 5. Status Transition Log
      await this.recordStatusTransition(queryRunner.manager, savedTx.id, null, StatusEnum.COMPLETED, 'Initial funding');

      // 6. Double-entry record: Credit User, Debit System
      const ledgerEntries = [
        queryRunner.manager.create(LedgerEntry, {
          transactionId: savedTx.id,
          walletId: userWallet.id,
          entryType: EntryType.CREDIT,
          currency,
          amount,
          balanceBefore: userBalanceBefore,
          balanceAfter: userWallet.balance,
          description: `User Wallet credit: ${amount} ${currency}`,
        }),
        queryRunner.manager.create(LedgerEntry, {
          transactionId: savedTx.id,
          walletId: systemWallet.id,
          entryType: EntryType.DEBIT,
          currency,
          amount,
          balanceBefore: systemBalanceBefore,
          balanceAfter: systemWallet.balance,
          description: `System Pool debit: ${amount} ${currency}`,
        }),
      ];
      await queryRunner.manager.save(LedgerEntry, ledgerEntries);

      await queryRunner.commitTransaction();
      return savedTx;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Funding failed: ${err.message}`, err.stack);
      err.location = 'WalletService.fundWallet';
      this.resHandler.error(err);
    } finally {
      await queryRunner.release();
    }
  }

  async convertCurrency(userId: string, fromCurrency: Currency, toCurrency: Currency, fromAmount: number, idempotencyKey?: string): Promise<Transaction> {
    if (fromAmount <= 0) throw new BadRequestException('Amount must be positive');
    if (fromCurrency === toCurrency) throw new BadRequestException('Cannot convert to same currency');

    const rate = await this.fxService.getRate(fromCurrency, toCurrency);
    const toAmount = Number((fromAmount * rate).toFixed(8));

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('SERIALIZABLE');

    try {
      // 1. Race-safe Idempotency Check
      if (idempotencyKey) {
        const existingTx = await queryRunner.manager.findOne(Transaction, {
          where: { idempotencyKey },
        });
        if (existingTx) {
          await queryRunner.rollbackTransaction();
          return existingTx;
        }
      }

      // 2. Lock Wallets
      const sourceWallet = await queryRunner.manager.findOne(Wallet, {
        where: { userId, currency: fromCurrency },
        lock: { mode: 'pessimistic_write' },
      });

      if (!sourceWallet || Number(sourceWallet.balance) < fromAmount) {
        throw new BadRequestException('Insufficient balance');
      }

      let targetWallet = await queryRunner.manager.findOne(Wallet, {
        where: { userId, currency: toCurrency },
        lock: { mode: 'pessimistic_write' },
      });

      if (!targetWallet) {
        targetWallet = queryRunner.manager.create(Wallet, { userId, currency: toCurrency, balance: 0 });
        targetWallet = await queryRunner.manager.save(targetWallet);
      }

      const sourceBalanceBefore = Number(sourceWallet.balance);
      const targetBalanceBefore = Number(targetWallet.balance);

      // 3. Update balances
      sourceWallet.balance = sourceBalanceBefore - Number(fromAmount);
      targetWallet.balance = targetBalanceBefore + Number(toAmount);

      await queryRunner.manager.save(Wallet, [sourceWallet, targetWallet]);

      // 4. Create Transaction
      const transaction = queryRunner.manager.create(Transaction, {
        userId,
        type: TransactionType.CONVERT,
        fromCurrency,
        toCurrency,
        fromAmount,
        toAmount,
        fxRate: rate,
        status: StatusEnum.COMPLETED,
        idempotencyKey,
        referenceId: generateRef('CNV'),
      });
      const savedTx = await queryRunner.manager.save(transaction);

      // 5. Status Log
      await this.recordStatusTransition(queryRunner.manager, savedTx.id, null, StatusEnum.COMPLETED, 'Conversion completed');

      // 6. Ledger entries (Double Entry)
      const entries = [
        queryRunner.manager.create(LedgerEntry, {
          transactionId: savedTx.id,
          walletId: sourceWallet.id,
          entryType: EntryType.DEBIT,
          currency: fromCurrency,
          amount: fromAmount,
          balanceBefore: sourceBalanceBefore,
          balanceAfter: sourceWallet.balance,
          description: `Currency conversion debit: ${fromAmount} ${fromCurrency}`,
        }),
        queryRunner.manager.create(LedgerEntry, {
          transactionId: savedTx.id,
          walletId: targetWallet.id,
          entryType: EntryType.CREDIT,
          currency: toCurrency,
          amount: toAmount,
          balanceBefore: targetBalanceBefore,
          balanceAfter: targetWallet.balance,
          description: `Currency conversion credit: ${toAmount} ${toCurrency}`,
        }),
      ];
      await queryRunner.manager.save(LedgerEntry, entries);

      await queryRunner.commitTransaction();
      return savedTx;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Conversion failed: ${err.message}`, err.stack);
      err.location = 'WalletService.convertCurrency';
      this.resHandler.error(err);
    } finally {
      await queryRunner.release();
    }
  }

  async tradeCurrency(userId: string, fromCurrency: Currency, toCurrency: Currency, fromAmount: number, idempotencyKey?: string): Promise<Transaction> {
    try {
      const tx = await this.convertCurrency(userId, fromCurrency, toCurrency, fromAmount, idempotencyKey);
      tx.type = TransactionType.TRADE;
      await this.dataSource.getRepository(Transaction).save(tx);
      return tx;
    } catch (error) {
      error.location = 'WalletService.tradeCurrency';
      this.resHandler.error(error);
    }
  }
}
