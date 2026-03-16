import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AdminFundUserDto } from './dto/admin.dto';

export function SwaggerGetUsers() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({ summary: 'List all users' }),
    ApiResponse({ status: 200, description: 'Users retrieved' }),
  );
}

export function SwaggerToggleUserStatus() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({ summary: 'Activate/Deactivate user account' }),
    ApiResponse({ status: 200, description: 'Status toggled successfully' }),
  );
}

export function SwaggerAdminFundUser() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({ summary: 'Fund a user wallet (Admin only)' }),
    ApiBody({ type: AdminFundUserDto }),
    ApiResponse({ status: 200, description: 'User wallet funded successfully' }),
  );
}

export function SwaggerGetAllTransactions() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({ summary: 'View all system transactions' }),
    ApiResponse({ status: 200, description: 'Transactions retrieved' }),
  );
}
