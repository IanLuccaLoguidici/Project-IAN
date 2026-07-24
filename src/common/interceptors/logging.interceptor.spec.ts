import { LoggingInterceptor } from './logging.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { Logger } from 'winston';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let loggerMock: jest.Mocked<Logger>;

  beforeEach(() => {
    loggerMock = {
      info: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    interceptor = new LoggingInterceptor(loggerMock);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should log incoming request and successful completion with duration and requestId', (done) => {
    const mockReq = {
      method: 'GET',
      originalUrl: '/api/v1/users',
      requestId: 'test-req-id-123',
    };
    const mockRes = {
      statusCode: 200,
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockReq,
        getResponse: () => mockRes,
      }),
    } as unknown as ExecutionContext;

    const mockHandler: CallHandler = {
      handle: () => of({ data: 'success' }),
    };

    interceptor.intercept(mockContext, mockHandler).subscribe({
      next: () => {
        expect(loggerMock.info).toHaveBeenCalledWith('Incoming request', {
          method: 'GET',
          path: '/api/v1/users',
          requestId: 'test-req-id-123',
        });

        expect(loggerMock.info).toHaveBeenCalledWith('Request completed', expect.objectContaining({
          method: 'GET',
          path: '/api/v1/users',
          statusCode: 200,
          requestId: 'test-req-id-123',
        }));

        done();
      },
    });
  });

  it('should log error when request fails', (done) => {
    const mockReq = {
      method: 'POST',
      originalUrl: '/api/v1/todos',
      requestId: 'test-req-id-error',
    };
    const mockRes = {
      statusCode: 500,
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockReq,
        getResponse: () => mockRes,
      }),
    } as unknown as ExecutionContext;

    const testError = { status: 400, message: 'Bad request' };
    const mockHandler: CallHandler = {
      handle: () => throwError(() => testError),
    };

    interceptor.intercept(mockContext, mockHandler).subscribe({
      error: (err) => {
        expect(err).toEqual(testError);
        expect(loggerMock.error).toHaveBeenCalledWith('Request failed', expect.objectContaining({
          method: 'POST',
          path: '/api/v1/todos',
          statusCode: 400,
          requestId: 'test-req-id-error',
          error: testError,
        }));

        done();
      },
    });
  });
});
