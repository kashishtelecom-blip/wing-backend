import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { WaitlistService } from './waitlist.service';
import { JoinWaitlistDto } from './dto/join-waitlist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('waitlist')
@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Get('check')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  check(@Request() req, @Query('source') source?: string) {
    return this.waitlistService.check(req.user.userId, source);
  }

  @Get('count')
  count(@Query('source') source?: string) {
    return this.waitlistService.count(source);
  }

  @Post('join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  join(@Request() req, @Body() dto: JoinWaitlistDto) {
    return this.waitlistService.join(req.user.userId, dto);
  }
}