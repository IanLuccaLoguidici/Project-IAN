import { RequestIdMiddleware, REQUEST_ID_HEADER } from './request-id.middleware';
import { Request, Response } from 'express';

describe('RequestIdMiddleware', () => {
  let middleware: RequestIdMiddleware;

  beforeEach(() => {
    middleware = new RequestIdMiddleware();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should generate a new requestId if not present in request headers', () => {
    const req = {
      headers: {},
    } as unknown as Request & { requestId: string };

    const setHeaderMock = jest.fn();
    const res = {
      setHeader: setHeaderMock,
    } as unknown as Response;

    const nextMock = jest.fn();

    middleware.use(req, res, nextMock);

    expect(req.requestId).toBeDefined();
    expect(typeof req.requestId).toBe('string');
    expect(setHeaderMock).toHaveBeenCalledWith(REQUEST_ID_HEADER, req.requestId);
    expect(nextMock).toHaveBeenCalled();
  });

  it('should reuse existing requestId if present in request headers', () => {
    const existingRequestId = 'custom-request-id-1234';
    const req = {
      headers: {
        [REQUEST_ID_HEADER]: existingRequestId,
      },
    } as unknown as Request & { requestId: string };

    const setHeaderMock = jest.fn();
    const res = {
      setHeader: setHeaderMock,
    } as unknown as Response;

    const nextMock = jest.fn();

    middleware.use(req, res, nextMock);

    expect(req.requestId).toBe(existingRequestId);
    expect(setHeaderMock).toHaveBeenCalledWith(REQUEST_ID_HEADER, existingRequestId);
    expect(nextMock).toHaveBeenCalled();
  });
});
