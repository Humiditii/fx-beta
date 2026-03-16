import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Currency } from 'src/common/interface/main.interface';

export function SwaggerGetTransactionHistory() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({ summary: 'Get transaction history' }),
    ApiQuery({ name: 'type', required: false }),
    ApiQuery({ name: 'currency', enum: Currency, required: false }),
    ApiQuery({ name: 'page', required: false, type: Number }),
    ApiQuery({ name: 'limit', required: false, type: Number }),
    ApiResponse({ status: 200, description: 'History retrieved' }),
  );
}

export function SwaggerGetTransactionDetails() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({ summary: 'Get transaction details' }),
    ApiResponse({ status: 200, description: 'Details retrieved' }),
  );
}
