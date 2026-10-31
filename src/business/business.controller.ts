import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BusinessService } from './business.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { avatarStorage, mediaStorage } from '../cloudinary.config';

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

  @Patch(':slug')
  @UseGuards(JwtAuthGuard)
  updatePage(@Request() req: any, @Param('slug') slug: string, @Body() body: any) {
    return this.businessService.updatePage(slug, req.user.userId, body);
  }

  @Post(':slug/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { storage: avatarStorage }))
  async updateAvatar(
    @Request() req: any,
    @Param('slug') slug: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const url = (file as any).path || (file as any).secure_url || '';
    return this.businessService.updateAvatar(slug, req.user.userId, url);
  }

  @Post(':slug/cover')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { storage: mediaStorage }))
  async updateCover(
    @Request() req: any,
    @Param('slug') slug: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const url = (file as any).path || (file as any).secure_url || '';
    return this.businessService.updateCover(slug, req.user.userId, url);
  }
}