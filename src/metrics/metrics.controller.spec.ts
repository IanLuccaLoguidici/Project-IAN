import { Test, TestingModule } from '@nestjs/testing';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { Response } from 'express';

describe('MetricsController', () => {
  let controller: MetricsController;
  let serviceMock: {
    getPrometheusMetrics: jest.Mock;
    getPrometheusContentType: jest.Mock;
    getMetrics: jest.Mock;
  };

  beforeEach(async () => {
    serviceMock = {
      getPrometheusMetrics: jest.fn(),
      getPrometheusContentType: jest.fn(),
      getMetrics: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricsController],
      providers: [
        { provide: MetricsService, useValue: serviceMock },
      ],
    }).compile();

    controller = module.get<MetricsController>(MetricsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should send Prometheus metrics with correct Content-Type', async () => {
    const mockMetrics = '# HELP http_requests_total Total number of HTTP requests processed\n';
    const mockContentType = 'text/plain; version=0.0.4; charset=utf-8';

    serviceMock.getPrometheusMetrics.mockResolvedValue(mockMetrics);
    serviceMock.getPrometheusContentType.mockReturnValue(mockContentType);

    const mockRes = {
      setHeader: jest.fn(),
      send: jest.fn(),
    } as unknown as Response;

    await controller.getMetrics(mockRes);

    expect(serviceMock.getPrometheusMetrics).toHaveBeenCalled();
    expect(serviceMock.getPrometheusContentType).toHaveBeenCalled();
    expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', mockContentType);
    expect(mockRes.send).toHaveBeenCalledWith(mockMetrics);
  });

  it('should return cache metrics from getCacheMetrics()', () => {
    const mockCacheMetrics = { cacheHits: 5, cacheMisses: 2, hitRatio: 0.71, totalRequests: 7 };
    serviceMock.getMetrics.mockReturnValue(mockCacheMetrics);

    const result = controller.getCacheMetrics();
    expect(result).toEqual(mockCacheMetrics);
  });
});
