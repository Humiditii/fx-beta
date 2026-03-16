import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuditLog } from '../database/entities/audit-log.entity';

import { AppResponse } from 'src/common/appRespose.parser';

@Injectable()
export class AuditLogService {
  private resHandler = AppResponse;
  constructor(private readonly dataSource: DataSource) {}

  async log(data: {
    action: string;
    entity: string;
    entityId: string;
    userId?: string;
    before?: any;
    after?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      const repo = this.dataSource.getRepository(AuditLog);
      const log = repo.create(data);
      await repo.save(log);
    } catch (error) {
      error.location = 'AuditLogService.log';
      this.resHandler.error(error);
    }
  }

  async getLogs(filter: { userId?: string; action?: string; page?: number; limit?: number }): Promise<any> {
    try {
      const page = filter.page || 1;
      const limit = filter.limit || 20;
      const skip = (page - 1) * limit;

      const queryBuilder = this.dataSource.getRepository(AuditLog)
        .createQueryBuilder('log')
        .orderBy('log.createdAt', 'DESC')
        .skip(skip)
        .take(limit);

      if (filter.userId) {
        queryBuilder.andWhere('log.userId = :userId', { userId: filter.userId });
      }

      if (filter.action) {
        queryBuilder.andWhere('log.action = :action', { action: filter.action });
      }

      const [logs, total] = await queryBuilder.getManyAndCount();

      return {
        logs,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      error.location = 'AuditLogService.getLogs';
      this.resHandler.error(error);
    }
  }
}
