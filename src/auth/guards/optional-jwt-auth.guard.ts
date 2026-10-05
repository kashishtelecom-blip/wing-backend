import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Like JwtAuthGuard, but does NOT throw if no token is present.
 * Sets req.user to the decoded user if a valid token exists,
 * otherwise leaves req.user as undefined.
 * Use for public endpoints that want optional personalization.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    // Never throw — just return whatever we got (or undefined)
    return user || undefined;
  }
}