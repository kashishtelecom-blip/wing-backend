import { Controller, Post, Get, Param, UseGuards, Request } from '@nestjs/common';
import { EarningsService } from './earnings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('earnings')
@UseGuards(JwtAuthGuard)
export class EarningsController {
  constructor(private readonly earningsService: EarningsService) {}

  @Post('track/:wingId')
  track(@Request() req: any, @Param('wingId') wingId: string) {
    return this.earningsService.trackImpression(wingId, req.user.userId);
  }

  @Get('me')
  getEarnings(@Request() req: any) {
    return this.earningsService.getMyEarnings(req.user.userId);
  }
}