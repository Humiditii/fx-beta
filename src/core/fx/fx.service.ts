import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { firstValueFrom } from 'rxjs';
import { Currency } from 'src/common/interface/main.interface';
import { DataSource } from 'typeorm';
import { FxRateLog } from '../database/entities/fx-rate-log.entity';
import { FX_CONSTANTS } from 'src/common/constants/fx.constants';
import { AppResponse } from 'src/common/appRespose.parser';
import axiosRetry from 'axios-retry';

@Injectable()
export class FxService {
  private readonly logger = new Logger(FxService.name);
  private resHandler = AppResponse;
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly dataSource: DataSource,
  ) {
    this.apiKey = this.configService.get('FX_API_KEY');
    this.baseUrl = this.configService.get('FX_API_BASE_URL');

    // Setup retry for the underlying axios instance
    axiosRetry(this.httpService.axiosRef, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status === 429;
      },
    });
  }

  async getRates(base: Currency = Currency.NGN): Promise<any> {
    try {
      const cacheKey = `fx_rates:${base}`;
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        return cached;
      }

      const rates = await this.fetchRates(base);
      return rates;
    } catch (error) {
      error.location = 'FxService.getRates';
      this.resHandler.error(error);
    }
  }

  async getRate(base: Currency, quote: Currency): Promise<number> {
    try {
      if (base === quote) return 1;

      const rates = await this.getRates(base);
      const rate = rates[quote];
      if (!rate) {
        throw new Error(`Rate not found for ${quote}`);
      }

      return rate;
    } catch (error) {
      error.location = 'FxService.getRate';
      this.resHandler.error(error);
    }
  }

  private async fetchRates(base: Currency): Promise<Record<string, number>> {
    try {
      const url = `${this.baseUrl}/${this.apiKey}/latest/${base}`;
      const { data } = await firstValueFrom(this.httpService.get(url));

      if (data.result === 'success') {
        const rates = data.conversion_rates;
        const cacheKey = `fx_rates:${base}`;

        await this.cacheManager.set(cacheKey, rates, FX_CONSTANTS.CACHE_TTL_MINUTES * 60 * 1000);

        // Background task to log rates to DB
        this.logRatesToDb(base, rates).catch(err => this.logger.error('Failed to log rates', err.stack));

        return rates;
      }
      throw new Error(data['error-type'] || 'Unknown FX API error');
    } catch (error) {
      this.logger.error(`Error fetching FX rates for ${base}: ${error.message}`);

      // Fallback: try to get the latest rates from our own DB logs
      const fallbackRates = await this.getLatestRatesFromDb(base);
      if (fallbackRates) {
        this.logger.warn(`Using fallback rates from database for ${base}`);
        return fallbackRates;
      }

      throw error; // Re-throw to be caught by getRates/getRate
    }
  }

  private async logRatesToDb(base: Currency, rates: Record<string, number>): Promise<void> {
    try {
      const logs = Object.entries(rates)
        .filter(([currency]) => Object.values(Currency).includes(currency as Currency))
        .map(([currency, rate]) => {
          const log = new FxRateLog();
          log.baseCurrency = base;
          log.quoteCurrency = currency as Currency;
          log.rate = rate;
          log.source = 'exchangerate-api';
          return log;
        });

      if (logs.length > 0) {
        await this.dataSource.getRepository(FxRateLog).save(logs);
      }
    } catch (error) {
      this.logger.error('Failed to log rates to DB', error.stack);
    }
  }

  private async getLatestRatesFromDb(base: Currency): Promise<Record<string, number> | null> {
    try {
      const repo = this.dataSource.getRepository(FxRateLog);
      const latestLogs = await repo.find({
        where: { baseCurrency: base },
        order: { fetchedAt: 'DESC' },
        take: 10,
      });

      if (latestLogs.length === 0) return null;

      const rates: Record<string, number> = {};
      latestLogs.forEach(log => {
        rates[log.quoteCurrency] = Number(log.rate);
      });
      return rates;
    } catch (error) {
      this.logger.error('Failed to get latest rates from DB', error.stack);
      return null;
    }
  }
}
