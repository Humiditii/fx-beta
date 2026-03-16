import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { FxService } from './fx.service';
import { Public } from 'src/common/guard/decorator/public.decorator';
import { AppResponse } from 'src/common/appRespose.parser';
import { Currency } from 'src/common/interface/main.interface';
import { SwaggerGetRates } from './fx.swagger';

@Controller('fx')
export class FxController {
  constructor(private readonly fxService: FxService) {}

  @Public()
  @SwaggerGetRates()
  @Get('rates')
  async getRates(
    @Res() res: Response,
    @Query('base') base: Currency = Currency.NGN,
  ): Promise<Response> {
    const data = await this.fxService.getRates(base);
    return res.status(200).json(AppResponse.success('Rates retrieved successfully', 200, data));
  }
}
