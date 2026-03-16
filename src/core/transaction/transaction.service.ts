import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Transaction } from '../database/entities/transaction.entity';
import { Currency } from 'src/common/interface/main.interface';
import { AppResponse } from 'src/common/appRespose.parser';

@Injectable()
export class TransactionService {
  private resHandler = AppResponse;
  constructor(private readonly dataSource: DataSource) {}

  async getHistory(userId: string, filter: { type?: string; currency?: Currency; page?: number; limit?: number }): Promise<any> {
    try {
      const page = filter.page || 1;
      const limit = filter.limit || 10;
      const skip = (page - 1) * limit;

      const queryBuilder = this.dataSource.getRepository(Transaction)
        .createQueryBuilder('tx')
        .where('tx.userId = :userId', { userId })
        .orderBy('tx.createdAt', 'DESC')
        .skip(skip)
        .take(limit);

      if (filter.type) {
        queryBuilder.andWhere('tx.type = :type', { type: filter.type });
      }

      if (filter.currency) {
        queryBuilder.andWhere('(tx.fromCurrency = :currency OR tx.toCurrency = :currency)', { currency: filter.currency });
      }

      const [transactions, total] = await queryBuilder.getManyAndCount();

      return {
        transactions,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      error.location = 'TransactionService.getHistory';
      this.resHandler.error(error);
    }
  }

  async getAllTransactions(filter: any): Promise<any> {
    try {
      // Admin version
      return this.getHistory(filter.userId, filter); // Simplified for now
    } catch (error) {
      error.location = 'TransactionService.getAllTransactions';
      this.resHandler.error(error);
    }
  }

  async getTransactionById(userId: string, id: string): Promise<Transaction> {
    try {
      const tx = await this.dataSource.getRepository(Transaction).findOne({
        where: { id, userId },
        relations: ['ledgerEntries', 'statusLogs'],
      });

      if (!tx) {
        throw new NotFoundException('Transaction not found');
      }

      return tx;
    } catch (error) {
      error.location = 'TransactionService.getTransactionById';
      this.resHandler.error(error);
    }
  }
}
