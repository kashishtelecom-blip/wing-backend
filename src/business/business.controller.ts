import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { BusinessService } from './business.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req: any, @Body() body: any) {
    return this.businessService.create(req.user.userId, body);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  getMine(@Request() req: any) {
    return this.businessService.getMyPages(req.user.userId);
  }

  @Get(':slug')
  getPage(@Param('slug') slug: string) {
    return this.businessService.getPageBySlug(slug);
  }

  @Post(':slug/follow')
  @UseGuards(JwtAuthGuard)
  follow(@Request() req: any, @Param('slug') slug: string) {
    return this.businessService.toggleFollow(slug, req.user.userId);
  }
}