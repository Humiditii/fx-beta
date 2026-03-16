import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FxService } from '../fx/fx.service';
import { Currency } from 'src/common/interface/main.interface';

@Injectable()
export class FxRefreshJob {
  private readonly logger = new Logger(FxRefreshJob.name);

  constructor(private readonly fxService: FxService) { }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async refreshRates() {
    this.logger.log('Starting scheduled FX rate refresh...');
    try {
      // Refresh rates for major bases
      await Promise.all([
        this.fxService.getRates(Currency.NGN),
        this.fxService.getRates(Currency.USD),
        this.fxService.getRates(Currency.EUR),
      ]);
      this.logger.log('FX rates refreshed successfully.');
    } catch (error) {
      this.logger.error('Scheduled FX refresh failed', error.stack);
    }
  }
}
