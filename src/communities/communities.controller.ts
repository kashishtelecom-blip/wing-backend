import {
  Controller, Get, Post, Delete, Body, Param, Query,
  UseGuards, Request, BadRequestException,
  UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CommunitiesService } from './communities.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { mediaStorage } from '../cloudinary.config';

const IMAGE_EXT = /\.(jpg|jpeg|png|gif|webp)$/i;
const VIDEO_EXT = /\.(mp4|webm|mov|m4v)$/i;

@ApiTags('communities')
@Controller('communities')
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  findAll(@Query('q') q?: string) {
    return this.communitiesService.findAll(q);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getMine(@Request() req) {
    return this.communitiesService.getMyCommunities(req.user.userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.communitiesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@Request() req, @Body() dto: CreateCommunityDto) {
    return this.communitiesService.create(req.user.userId, dto);
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  join(@Request() req, @Param('id') id: string) {
    return this.communitiesService.join(req.user.userId, id);
  }

  @Delete(':id/leave')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  leave(@Request() req, @Param('id') id: string) {
    return this.communitiesService.leave(req.user.userId, id);
  }

  // ============ GROUP CHAT ============
  @Get(':id/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getMessages(@Request() req, @Param('id') id: string) {
    return this.communitiesService.getMessages(id, req.user.userId);
  }

  @Post(':id/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  sendMessage(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { text?: string; mediaUrl?: string; mediaType?: 'image' | 'video'; replyTo?: string },
  ) {
    if (!body?.text && !body?.mediaUrl) {
      throw new BadRequestException('text or media required');
    }
    return this.communitiesService.sendMessage(
      id,
      req.user.userId,
      body.text || '',
      body.mediaUrl,
      body.mediaType,
      body.replyTo,
    );
  }

  @Post(':id/upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: mediaStorage,
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  async uploadCommunityMedia(
    @Request() req,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const isImage = IMAGE_EXT.test(file.originalname);
    const isVideo = VIDEO_EXT.test(file.originalname);
    if (!isImage && !isVideo) {
      throw new BadRequestException('Only images or videos allowed');
    }
    const url = (file as any).path || (file as any).secure_url || '';
    return { url, type: isVideo ? 'video' : 'image' };
  }

  @Delete(':id/messages/:messageId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  deleteMessage(
    @Request() req,
    @Param('id') id: string,
    @Param('messageId') messageId: string,
  ) {
    return this.communitiesService.deleteMessage(id, req.user.userId, messageId);
  }

  // ============ MEMBERS ============
  @Post(':id/add-members')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  addMembers(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { userIds: string[] },
  ) {
    return this.communitiesService.addMembers(
      req.user.userId,
      id,
      body.userIds || [],
    );
  }

  @Delete(':id/members/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  removeMember(
    @Request() req,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.communitiesService.removeMember(
      req.user.userId,
      id,
      userId,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  remove(@Request() req, @Param('id') id: string) {
    return this.communitiesService.delete(req.user.userId, id);
  }
}