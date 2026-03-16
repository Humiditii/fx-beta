import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Transaction } from './transaction.entity';
import { Wallet } from './wallet.entity';
import { Currency } from 'src/common/interface/main.interface';

export enum EntryType {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

@Entity('ledger_entries')
export class LedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  transactionId: string;

  @ManyToOne(() => Transaction, (transaction) => transaction.ledgerEntries)
  transaction: Transaction;

  @Column()
  @Index()
  walletId: string;

  @ManyToOne(() => Wallet, (wallet) => wallet.ledgerEntries)
  wallet: Wallet;

  @Column({ type: 'enum', enum: EntryType })
  entryType: EntryType;

  @Column({ type: 'enum', enum: Currency })
  @Index()
  currency: Currency;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  amount: number;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  balanceBefore: number;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  balanceAfter: number;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
