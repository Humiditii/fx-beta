import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import DailyRotateFile = require('winston-daily-rotate-file');
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FxLoggerService implements LoggerService {
  private logger: winston.Logger;

  constructor(private readonly configService: ConfigService) {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const serviceName = this.configService.get('SERVICE_NAME') || 'fx-trading-service';

    const dailyRotateFileTransport = new DailyRotateFile({
      filename: `logs/${serviceName}-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: 'info',
    });

    const consoleTransport = new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    });

    this.logger = winston.createLogger({
      level: 'info',
      defaultMeta: { service: serviceName },
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, service }) => {
          return `[${timestamp}] [${service}] ${level.toUpperCase()}: ${message}`;
        }),
      ),
      transports: [
        dailyRotateFileTransport,
        ...(isProduction ? [] : [consoleTransport]),
      ],
    });
  }

  log(message: string): void {
    this.logger.info(message);
  }

  error(message: string, trace?: string): void {
    this.logger.error(`${message} - Trace: ${trace}`);
  }

  warn(message: string): void {
    this.logger.warn(message);
  }

  debug?(message: string): void {
    this.logger.debug(message);
  }

  verbose?(message: string): void {
    this.logger.verbose(message);
  }
}
