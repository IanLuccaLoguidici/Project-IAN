import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    let req: any;

    if ((context.getType() as string) === 'graphql') {
      const ctx = GqlExecutionContext.create(context);
      req = ctx.getContext().req;
    } else {
      req = context.switchToHttp().getRequest();
    }

    if (!req) return true;

    const tenantId = req.headers['x-tenant-id'];
    if (tenantId) {
      req.tenantId = tenantId;
    }

    return true;
  }
}
