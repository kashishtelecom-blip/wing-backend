import { 
  Controller, Get, Post, Delete, Param, Body, UseGuards, Request, 
  UseInterceptors, UploadedFile, BadRequestException 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StoriesService } from './stories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { mediaStorage } from '../cloudinary.config';

@Controller('stories')
@UseGuards(JwtAuthGuard)
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  // 1. Upload the media file to Cloudinary
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage: mediaStorage, limits: { fileSize: 50 * 1024 * 1024 } }))
  uploadMedia(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const mediaUrl = (file as any).path || (file as any).secure_url || '';
    return { mediaUrl };
  }

  // 2. Save the story (after upload)
  @Post()
  create(
    @Request() req: any,
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