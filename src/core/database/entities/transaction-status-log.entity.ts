import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Transaction } from './transaction.entity';
import { StatusEnum } from 'src/common/interface/main.interface';

@Entity('transaction_status_logs')
export class TransactionStatusLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  transactionId: string;

  @ManyToOne(() => Transaction)
  transaction: Transaction;

  @Column({ type: 'enum', enum: StatusEnum, nullable: true })
  fromStatus: StatusEnum;

  @Column({ type: 'enum', enum: StatusEnum })
  toStatus: StatusEnum;

  @Column({ nullable: true })
  reason: string;

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
