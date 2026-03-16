import { Body, Controller, Post, Get, Req, Res, UseInterceptors } from '@nestjs/common';
import { Response } from 'express';
import { WalletService } from './wallet.service';
import {
  SwaggerGetBalances,
  SwaggerFundWallet,
  SwaggerConvertCurrency,
  SwaggerTradeCurrency,
} from './wallet.swagger';
import { AppResponse } from 'src/common/appRespose.parser';
import { IdempotencyInterceptor } from 'src/common/interceptor/idempotency.interceptor';
import { ConvertCurrencyDto, FundWalletDto } from './dto/wallet.dto';


@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) { }

  @SwaggerGetBalances()
  @Get()
  async getBalances(@Res() res: Response, @Req() req: any): Promise<Response> {
    const data = await this.walletService.getBalances(req.user.userId);
    return res.status(200).json(AppResponse.success('Balances retrieved', 200, data));
  }

  @SwaggerFundWallet()
  @Post('fund')
  @UseInterceptors(IdempotencyInterceptor)
  async fund(
    @Res() res: Response,
    @Req() req: any,
    @Body() dto: FundWalletDto
  ): Promise<Response> {
    const idempotencyKey = req.headers['idempotency-key'] as string;
    const data = await this.walletService.fundWallet(req.user.userId, dto.currency, dto.amount, idempotencyKey);
    return res.status(200).json(AppResponse.success('Wallet funded successfully', 200, data));
  }

  @SwaggerConvertCurrency()
  @Post('convert')
  @UseInterceptors(IdempotencyInterceptor)
  async convert(
    @Res() res: Response,
    @Req() req: any,
    @Body() dto: ConvertCurrencyDto
  ): Promise<Response> {
    const idempotencyKey = req.headers['idempotency-key'] as string;
    const data = await this.walletService.convertCurrency(req.user.userId, dto.fromCurrency, dto.toCurrency, dto.fromAmount, idempotencyKey);
    return res.status(200).json(AppResponse.success('Currency converted successfully', 200, data));
  }

  @SwaggerTradeCurrency()
  @Post('trade')
  @UseInterceptors(IdempotencyInterceptor)
  async trade(
    @Res() res: Response,
    @Req() req: any,
    @Body() dto: ConvertCurrencyDto
  ): Promise<Response> {
    const idempotencyKey = req.headers['idempotency-key'] as string;
    const data = await this.walletService.tradeCurrency(req.user.userId, dto.fromCurrency, dto.toCurrency, dto.fromAmount, idempotencyKey);
    return res.status(200).json(AppResponse.success('Trade executed successfully', 200, data));
  }
}
