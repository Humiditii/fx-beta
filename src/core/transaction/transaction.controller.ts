import { Controller, Get, Query, Req, Res, Param } from '@nestjs/common';
import { Response } from 'express';
import { TransactionService } from './transaction.service';
import { SwaggerGetTransactionHistory, SwaggerGetTransactionDetails } from './transaction.swagger';
import { AppResponse } from 'src/common/appRespose.parser';
import { Currency } from 'src/common/interface/main.interface';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @SwaggerGetTransactionHistory()
  @Get()
  async getHistory(
    @Res() res: Response,
    @Req() req: any,
    @Query('type') type?: string,
    @Query('currency') currency?: Currency,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<Response> {
    const data = await this.transactionService.getHistory(req.user.userId, { type, currency, page, limit });
    return res.status(200).json(AppResponse.success('History retrieved', 200, data));
  }

  @SwaggerGetTransactionDetails()
  @Get(':id')
  async getDetails(@Res() res: Response, @Req() req: any, @Param('id') id: string): Promise<Response> {
    const data = await this.transactionService.getTransactionById(req.user.userId, id);
    return res.status(200).json(AppResponse.success('Details retrieved', 200, data));
  }
}
