import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from './metrics.service';

describe('MetricsService (Prometheus)', () => {
  let service: MetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MetricsService],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return Prometheus formatted metrics containing custom counters and histograms', async () => {
    const metricsOutput = await service.getPrometheusMetrics();

    expect(metricsOutput).toContain('http_requests_total');
    expect(metricsOutput).toContain('http_request_duration_seconds');
    expect(metricsOutput).toContain('http_errors_total');
  });

  it('should return correct Prometheus content type', () => {
    const contentType = service.getPrometheusContentType();
    expect(contentType).toContain('text/plain');
  });

  it('should record successful HTTP request metrics', async () => {
    service.recordRequest('GET', '/api/v1/test', 200, 0.05);

    const metricsOutput = await service.getPrometheusMetrics();
    expect(metricsOutput).toContain('http_requests_total{method="GET",route="/api/v1/test",status_code="200"} 1');
    expect(metricsOutput).toContain('http_request_duration_seconds_count{method="GET",route="/api/v1/test",status_code="200"} 1');
  });

  it('should record failed HTTP request metrics under http_errors_total', async () => {
    service.recordRequest('POST', '/api/v1/test', 500, 0.12);

    const metricsOutput = await service.getPrometheusMetrics();
    expect(metricsOutput).toContain('http_requests_total{method="POST",route="/api/v1/test",status_code="500"} 1');
    expect(metricsOutput).toContain('http_errors_total{method="POST",route="/api/v1/test",status_code="500"} 1');
  });

  it('should preserve cache metrics legacy functionality', () => {
    service.incrementHit();
    service.incrementHit();
    service.incrementMiss();

    const cacheMetrics = service.getMetrics();
    expect(cacheMetrics).toEqual({
      cacheHits: 2,
      cacheMisses: 1,
      hitRatio: 0.67,
      totalRequests: 3,
    });
  });
});
