import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export const REQUEST_ID_HEADER = 'x-request-id';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const requestId =
      (req.headers[REQUEST_ID_HEADER] as string) || randomUUID();

    // Make it available on the request object for interceptors / services
    (req as Request & { requestId: string }).requestId = requestId;

    // Echo it back in the response so clients can correlate
    res.setHeader(REQUEST_ID_HEADER, requestId);

    next();
  }
}
