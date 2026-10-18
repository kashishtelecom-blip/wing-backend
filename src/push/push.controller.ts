import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { PushService } from './push.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('push')
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  subscribe(@Request() req, @Body() sub: any) {
    return this.pushService.subscribe(req.user.userId, sub);
  }
}