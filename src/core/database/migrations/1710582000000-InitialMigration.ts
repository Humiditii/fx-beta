import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1710582000000 implements MigrationInterface {
  name = 'InitialMigration1710582000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'user')`);
    await queryRunner.query(`CREATE TYPE "public"."transactions_type_enum" AS ENUM('fund', 'convert', 'trade')`);
    await queryRunner.query(`CREATE TYPE "public"."transactions_status_enum" AS ENUM('pending', 'completed', 'failed')`);
    await queryRunner.query(`CREATE TYPE "public"."ledger_entries_entrytype_enum" AS ENUM('debit', 'credit')`);
    await queryRunner.query(`CREATE TYPE "public"."wallets_currency_enum" AS ENUM('NGN', 'USD', 'EUR', 'GBP', 'CAD', 'JPY')`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "password" character varying,
        "firstName" character varying NOT NULL,
        "lastName" character varying NOT NULL,
        "role" "public"."users_role_enum" NOT NULL DEFAULT 'user',
        "isVerified" boolean NOT NULL DEFAULT false,
        "isActive" boolean NOT NULL DEFAULT true,
        "otpCode" character varying,
        "otpExpiry" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_97672df88e78d052dd699c9513a" UNIQUE ("email"),
        CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "wallets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" character varying NOT NULL,
        "currency" "public"."wallets_currency_enum" NOT NULL,
        "balance" numeric(20,8) NOT NULL DEFAULT '0',
        "isSystem" boolean NOT NULL DEFAULT false,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_wallet_user_currency" UNIQUE ("userId", "currency"),
        CONSTRAINT "PK_8406138e682670d98410787d559" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "type" "public"."transactions_type_enum" NOT NULL,
        "fromCurrency" "public"."wallets_currency_enum",
        "toCurrency" "public"."wallets_currency_enum",
        "fromAmount" numeric(20,8) NOT NULL,
        "toAmount" numeric(20,8),
        "fxRate" numeric(20,8),
        "status" "public"."transactions_status_enum" NOT NULL DEFAULT 'pending',
        "idempotencyKey" character varying,
        "referenceId" character varying NOT NULL,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_transactions_idempotencyKey" UNIQUE ("idempotencyKey"),
        CONSTRAINT "UQ_transactions_referenceId" UNIQUE ("referenceId"),
        CONSTRAINT "PK_a21073dfca0bc61ff8e13f9bc67" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "ledger_entries" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "transactionId" uuid NOT NULL,
        "walletId" uuid NOT NULL,
        "entryType" "public"."ledger_entries_entrytype_enum" NOT NULL,
        "currency" "public"."wallets_currency_enum" NOT NULL,
        "amount" numeric(20,8) NOT NULL,
        "balanceBefore" numeric(20,8) NOT NULL,
        "balanceAfter" numeric(20,8) NOT NULL,
        "description" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ledger_entries_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "transaction_status_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "transactionId" uuid NOT NULL,
        "fromStatus" "public"."transactions_status_enum",
        "toStatus" "public"."transactions_status_enum" NOT NULL,
        "reason" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transaction_status_logs_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "fx_rate_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "baseCurrency" "public"."wallets_currency_enum" NOT NULL,
        "quoteCurrency" "public"."wallets_currency_enum" NOT NULL,
        "rate" numeric(20,8) NOT NULL,
        "source" character varying NOT NULL,
        "fetchedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fx_rate_logs_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid,
        "action" character varying NOT NULL,
        "entity" character varying NOT NULL,
        "entityId" character varying NOT NULL,
        "before" jsonb,
        "after" jsonb,
        "ipAddress" character varying,
        "userAgent" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_transactions_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "ledger_entries" ADD CONSTRAINT "FK_ledger_entries_transactionId" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "ledger_entries" ADD CONSTRAINT "FK_ledger_entries_walletId" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "transaction_status_logs" ADD CONSTRAINT "FK_status_logs_transactionId" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transaction_status_logs" DROP CONSTRAINT "FK_status_logs_transactionId"`);
    await queryRunner.query(`ALTER TABLE "ledger_entries" DROP CONSTRAINT "FK_ledger_entries_walletId"`);
    await queryRunner.query(`ALTER TABLE "ledger_entries" DROP CONSTRAINT "FK_ledger_entries_transactionId"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_transactions_userId"`);
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TABLE "fx_rate_logs"`);
    await queryRunner.query(`DROP TABLE "transaction_status_logs"`);
    await queryRunner.query(`DROP TABLE "ledger_entries"`);
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TABLE "wallets"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."wallets_currency_enum"`);
    await queryRunner.query(`DROP TYPE "public"."ledger_entries_entrytype_enum"`);
    await queryRunner.query(`DROP TYPE "public"."transactions_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."transactions_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
