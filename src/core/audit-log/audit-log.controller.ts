import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { SwaggerGetAuditLogs } from './audit-log.swagger';
import { Roles } from 'src/common/guard/decorator/roles.decorator';
import { Role } from 'src/common/interface/main.interface';
import { AppResponse } from 'src/common/appRespose.parser';

@Roles(Role.Admin)
@Controller('admin/audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @SwaggerGetAuditLogs()
  @Get()
  async getLogs(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const data = await this.auditLogService.getLogs({ userId, action, page, limit });
    return AppResponse.success('Audit logs retrieved', 200, data);
  }
}
