import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Currency, StatusEnum } from 'src/common/interface/main.interface';
import { LedgerEntry } from './ledger-entry.entity';
import { TransactionStatusLog } from './transaction-status-log.entity';

export enum TransactionType {
  FUND = 'fund',
  CONVERT = 'convert',
  TRADE = 'trade',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => User, (user) => user.transactions)
  user: User;

  @Column({ type: 'enum', enum: TransactionType })
  @Index()
  type: TransactionType;

  @Column({ type: 'enum', enum: Currency, nullable: true })
  fromCurrency: Currency;

  @Column({ type: 'enum', enum: Currency, nullable: true })
  toCurrency: Currency;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  fromAmount: number;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true })
  toAmount: number;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true })
  fxRate: number;

  @Column({ type: 'enum', enum: StatusEnum, default: StatusEnum.PENDING })
  @Index()
  status: StatusEnum;

  @Column({ nullable: true, unique: true })
  @Index()
  idempotencyKey: string;

  @Column({ unique: true })
  @Index()
  referenceId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @OneToMany(() => LedgerEntry, (entry) => entry.transaction)
  ledgerEntries: LedgerEntry[];

  @OneToMany(() => TransactionStatusLog, (log) => log.transaction)
  statusLogs: TransactionStatusLog[];
}
