import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Unique,
  OneToMany,
  Check,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Currency } from 'src/common/interface/main.interface';
import { LedgerEntry } from './ledger-entry.entity';

@Entity('wallets')
@Unique(['userId', 'currency'])
@Check(`"balance" >= 0`)
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => User, (user) => user.wallets)
  user: User;

  @Column({ type: 'enum', enum: Currency })
  @Index()
  currency: Currency;

  @Column('decimal', { precision: 20, scale: 8, default: 0 })
  balance: number;

  @Column({ default: false })
  @Index()
  isSystem: boolean;

  @Column({ default: true })
  @Index()
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => LedgerEntry, (entry) => entry.wallet)
  ledgerEntries: LedgerEntry[];
}
