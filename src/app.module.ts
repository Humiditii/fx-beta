import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { redisStore } from 'cache-manager-redis-yet';

import { AuthModule } from './core/auth/auth.module';
import { EmailModule } from './core/email/email.module';
import { FxModule } from './core/fx/fx.module';
import { WalletModule } from './core/wallet/wallet.module';
import { TransactionModule } from './core/transaction/transaction.module';
import { AuditLogModule } from './core/audit-log/audit-log.module';
import { AdminModule } from './core/admin/admin.module';
import { JobsModule } from './core/jobs/jobs.module';

import { AuthGuard } from './common/guard/auth.guard';
import { RoleGuard } from './common/guard/roles.guard';
import { AllGlobalExceptionsFilter } from './common/filters/globalFilter.filters';
import { HttpLogger } from './common/middleware/httpLogger.middleware';
import { FxLoggerService } from './common/logging/logging.service';

import { User } from './core/database/entities/user.entity';
import { Wallet } from './core/database/entities/wallet.entity';
import { Transaction } from './core/database/entities/transaction.entity';
import { LedgerEntry } from './core/database/entities/ledger-entry.entity';
import { FxRateLog } from './core/database/entities/fx-rate-log.entity';
import { AuditLog } from './core/database/entities/audit-log.entity';
import { TransactionStatusLog } from './core/database/entities/transaction-status-log.entity';
import KeyvRedis from '@keyv/redis';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        entities: [User, Wallet, Transaction, LedgerEntry, FxRateLog, AuditLog, TransactionStatusLog],
        synchronize: config.get<string>('NODE_ENV') === 'development',
        logging: false,
      }),
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        stores: [new KeyvRedis(config.get('REDIS_URL'))],
      }),
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    EmailModule,
    FxModule,
    WalletModule,
    TransactionModule,
    AuditLogModule,
    AdminModule,
    JobsModule,
  ],
  providers: [
    FxLoggerService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RoleGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllGlobalExceptionsFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLogger).forRoutes('*');
  }
}
