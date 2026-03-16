import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { Currency } from 'src/common/interface/main.interface';

export function SwaggerGetRates() {
  return applyDecorators(
    ApiOperation({ summary: 'Retrieve current FX rates for a base currency' }),
    ApiQuery({ name: 'base', enum: Currency, required: false, example: 'NGN' }),
    ApiResponse({ status: 200, description: 'Rates retrieved successfully' }),
  );
}
