import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from './entities/user.entity';
import { Wallet } from './entities/wallet.entity';
import { Transaction } from './entities/transaction.entity';
import { LedgerEntry } from './entities/ledger-entry.entity';
import { FxRateLog } from './entities/fx-rate-log.entity';
import { AuditLog } from './entities/audit-log.entity';
import { TransactionStatusLog } from './entities/transaction-status-log.entity';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User, Wallet, Transaction, LedgerEntry, FxRateLog, AuditLog, TransactionStatusLog],
  migrations: ['src/core/database/migrations/*.ts'],
  synchronize: process.env.NODE_ENV === 'development',
});
