import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { FxLoggerService } from '../logging/logging.service';

@Catch()
@Injectable()
export class AllGlobalExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: FxLoggerService) {}

  catch(exception: any, host: ArgumentsHost) {
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    if (exception instanceof HttpException) {
      status = exception.getStatus();
    } else if (typeof exception?.getStatus === 'function') {
      status = exception.getStatus();
    } else if (typeof exception?.status === 'number') {
      status = exception.status;
    } else if (typeof exception?.statusCode === 'number') {
      status = exception.statusCode;
    }

    let message = 'Internal server error @ FX Filter';
    if (exception instanceof HttpException) {
      const res: any = exception.getResponse();
      message = typeof res === 'object' ? res?.message || exception.message : res || exception.message;
    } else {
      message = exception?.message || exception?.response?.message || message;
    }

    if (Array.isArray(message)) {
      message = message.join(', ');
    }

    // log the error
    this.logger.error(
      `FX Filter Error: ${message}`,
      exception.stack || 'No stack trace available',
    );

    if (host.getType() === 'http') {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();

      const finalStatus = typeof status === 'number' ? status : 500;

      response.status(finalStatus).json({
        message: message,
        error: finalStatus,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }
  }
}
