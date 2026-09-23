import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../users/schemas/user.schema';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('No user found in request');
    }
    // user is set by JwtStrategy.validate, which returns { userId, email }
    // We need to fetch the user's role from the database or include it in the JWT.
    // For simplicity, we can include role in the JWT payload, but we'll fetch it here.
    // We'll add a method in AuthService to get user role by userId.
    // We'll modify JwtStrategy to also return role.
    // Or we can attach role to request after verifying JWT.
    // Let's do it by extending the JWT payload.
    // We'll adjust JwtStrategy later.
    // For now, let's assume the user object has a role property.
    // We'll ensure JwtStrategy adds it.
    return requiredRoles.some((role) => user.role === role);
  }
}