import { Test, TestingModule } from '@nestjs/testing';
import { MetricsInterceptor } from './metrics.interceptor';
import { MetricsService } from './metrics.service';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';

describe('MetricsInterceptor', () => {
  let interceptor: MetricsInterceptor;
  let metricsServiceMock: { recordRequest: jest.Mock };

  beforeEach(async () => {
    metricsServiceMock = {
      recordRequest: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsInterceptor,
        { provide: MetricsService, useValue: metricsServiceMock },
      ],
    }).compile();

    interceptor = module.get<MetricsInterceptor>(MetricsInterceptor);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should record request count and duration on successful HTTP request', (done) => {
    const mockReq = {
      method: 'GET',
      route: { path: '/api/v1/todos' },
      originalUrl: '/api/v1/todos',
    };
    const mockRes = {
      statusCode: 200,
    };

    const mockContext = {
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => mockReq,
        getResponse: () => mockRes,
      }),
    } as unknown as ExecutionContext;

    const mockHandler: CallHandler = {
      handle: () => of({ success: true }),
    };

    interceptor.intercept(mockContext, mockHandler).subscribe({
      next: () => {
        expect(metricsServiceMock.recordRequest).toHaveBeenCalledWith(
          'GET',
          '/api/v1/todos',
          200,
          expect.any(Number),
        );
        done();
      },
    });
  });

  it('should record error and duration on failed HTTP request', (done) => {
    const mockReq = {
      method: 'POST',
      route: { path: '/api/v1/todos' },
      originalUrl: '/api/v1/todos',
    };
    const mockRes = {
      statusCode: 500,
    };

    const mockContext = {
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => mockReq,
        getResponse: () => mockRes,
      }),
    } as unknown as ExecutionContext;

    const testError = { status: 404, message: 'Not found' };
    const mockHandler: CallHandler = {
      handle: () => throwError(() => testError),
    };

    interceptor.intercept(mockContext, mockHandler).subscribe({
      error: (err) => {
        expect(err).toEqual(testError);
        expect(metricsServiceMock.recordRequest).toHaveBeenCalledWith(
          'POST',
          '/api/v1/todos',
          404,
          expect.any(Number),
        );
        done();
      },
    });
  });

  it('should bypass non-http execution contexts (e.g. RPC or GraphQL)', (done) => {
    const mockContext = {
      getType: () => 'rpc',
    } as unknown as ExecutionContext;

    const mockHandler: CallHandler = {
      handle: () => of('rpc-response'),
    };

    interceptor.intercept(mockContext, mockHandler).subscribe({
      next: (val) => {
        expect(val).toBe('rpc-response');
        expect(metricsServiceMock.recordRequest).not.toHaveBeenCalled();
        done();
      },
    });
  });
});
