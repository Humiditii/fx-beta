import { Test, TestingModule } from '@nestjs/testing';
import { FxService } from './fx.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { DataSource } from 'typeorm';
import { of } from 'rxjs';
import { Currency } from 'src/common/interface/main.interface';
import { InternalServerErrorException } from '@nestjs/common';
import { AppException } from 'src/common/appRespose.parser';

describe('FxService', () => {
  let service: FxService;
  let httpService: HttpService;
  let cacheManager: any;

  beforeEach(async () => {
    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FxService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => {
              if (key === 'FX_API_KEY') return 'test-key';
              if (key === 'FX_API_BASE_URL') return 'http://api.test';
              return null;
            }),
          },
        },
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
            axiosRef: { interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } } },
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: cacheManager,
        },
        {
          provide: DataSource,
          useValue: {
            getRepository: jest.fn().mockReturnValue({
              save: jest.fn().mockResolvedValue([]),
              find: jest.fn().mockResolvedValue([]),
            }),
          },
        },
      ],
    }).compile();

    service = module.get<FxService>(FxService);
    httpService = module.get<HttpService>(HttpService);
  });

  describe('getRates', () => {
    it('should return cached rates if available', async () => {
      const cachedRates = { USD: 1.2, EUR: 0.9 };
      cacheManager.get.mockResolvedValue(cachedRates);

      const result = await service.getRates(Currency.NGN);

      expect(result).toEqual(cachedRates);
      expect(httpService.get).not.toHaveBeenCalled();
    });

    it('should fetch from API on cache miss and store in cache', async () => {
      const apiResponse = {
        data: {
          result: 'success',
          conversion_rates: { USD: 1.2, EUR: 0.9 },
        },
      };
      cacheManager.get.mockResolvedValue(null);
      (httpService.get as jest.Mock).mockReturnValue(of(apiResponse));

      const result = await service.getRates(Currency.NGN);

      expect(result).toEqual(apiResponse.data.conversion_rates);
      expect(cacheManager.set).toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException if API fails and no fallback exists', async () => {
      cacheManager.get.mockResolvedValue(null);
      (httpService.get as jest.Mock).mockReturnValue(of({ data: { result: 'error' } }));

      await expect(service.getRates(Currency.NGN)).rejects.toThrow(AppException);
    });
  });
});
