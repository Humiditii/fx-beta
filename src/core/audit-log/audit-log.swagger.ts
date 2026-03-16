import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

export function SwaggerGetAuditLogs() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({ summary: 'Get system audit logs (Admin only)' }),
    ApiQuery({ name: 'userId', required: false }),
    ApiQuery({ name: 'action', required: false }),
    ApiQuery({ name: 'page', required: false, type: Number }),
    ApiQuery({ name: 'limit', required: false, type: Number }),
    ApiResponse({ status: 200, description: 'Logs retrieved' }),
  );
}
