import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AdsService } from './ads.service';
import { CreateAdCampaignDto, UpdateAdCampaignDto } from './dto/create-ad-campaign.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('ads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ads')
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  @Get('campaigns/mine')
  findMine(@Request() req) {
    return this.adsService.findMine(req.user.userId);
  }

  @Get('campaigns/:id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.adsService.findOne(req.user.userId, id);
  }

  @Post('campaigns')
  create(@Request() req, @Body() dto: CreateAdCampaignDto) {
    return this.adsService.create(req.user.userId, dto);
  }

  @Patch('campaigns/:id')
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateAdCampaignDto) {
    return this.adsService.update(req.user.userId, id, dto);
  }

  @Delete('campaigns/:id')
  remove(@Request() req, @Param('id') id: string) {
    return this.adsService.remove(req.user.userId, id);
  }
}