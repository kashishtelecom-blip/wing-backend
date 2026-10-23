import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { StoriesService } from './stories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('stories')
@UseGuards(JwtAuthGuard)
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Post()
  create(
    @Request() req: any, // Type as any to avoid TS errors
    @Body() body: { mediaUrl: string; mediaType: 'image' | 'video' },
  ) {
    return this.storiesService.create(req.user.userId, body.mediaUrl, body.mediaType);
  }

  @Get('feed')
  getFeed(@Request() req: any) {
    return this.storiesService.getFeed(req.user.userId);
  }

  @Post(':id/view')
  markViewed(@Request() req: any, @Param('id') id: string) {
    return this.storiesService.markViewed(id, req.user.userId);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.storiesService.delete(id, req.user.userId);
  }
}