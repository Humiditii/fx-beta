import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';
import { Currency } from 'src/common/interface/main.interface';

@Entity('fx_rate_logs')
export class FxRateLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: Currency })
  @Index()
  baseCurrency: Currency;

  @Column({ type: 'enum', enum: Currency })
  @Index()
  quoteCurrency: Currency;

  @Column('decimal', { precision: 20, scale: 8 })
  rate: number;

  @Column()
  source: string;

  @CreateDateColumn()
  @Index()
  fetchedAt: Date;
}
