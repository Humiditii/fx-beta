import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../interface/main.interface';
import { ROLES_KEY } from './decorator/roles.decorator';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    // allow all routes with no Role decorator
    if (!requiredRoles) {
      return true;
    }
    // get the request object
    const req = context.switchToHttp().getRequest();

    if (!req?.user?.userRole) {
      return false;
    }

    return requiredRoles.some((role) => role === req.user.userRole);
  }
}
