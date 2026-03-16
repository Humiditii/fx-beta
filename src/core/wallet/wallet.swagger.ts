import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBody, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { ConvertCurrencyDto, FundWalletDto } from './dto/wallet.dto';

export function SwaggerGetBalances() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({ summary: 'Get user wallet balances' }),
    ApiResponse({ status: 200, description: 'Balances retrieved' }),
  );
}

export function SwaggerFundWallet() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({ summary: 'Fund wallet' }),
    ApiBody({ type: FundWalletDto }),
    ApiHeader({ name: 'idempotency-key', required: false, description: 'Unique key for idempotency' }),
    ApiResponse({ status: 200, description: 'Wallet funded successfully' }),
  );
}

export function SwaggerConvertCurrency() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({ summary: 'Convert currencies' }),
    ApiBody({ type: ConvertCurrencyDto }),
    ApiHeader({ name: 'idempotency-key', required: false, description: 'Unique key for idempotency' }),
    ApiResponse({ status: 200, description: 'Currency converted successfully' }),
  );
}

export function SwaggerTradeCurrency() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({ summary: 'Trade currencies' }),
    ApiBody({ type: ConvertCurrencyDto }),
    ApiHeader({ name: 'idempotency-key', required: false, description: 'Unique key for idempotency' }),
    ApiResponse({ status: 200, description: 'Trade executed successfully' }),
  );
}
