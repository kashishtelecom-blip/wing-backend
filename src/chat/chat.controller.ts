import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query,  // ← add Delete
  UseGuards, Request, BadRequestException,
  UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { mediaStorage } from '../cloudinary.config';

const IMAGE_EXT = /\.(jpg|jpeg|png|gif|webp)$/i;
const VIDEO_EXT = /\.(mp4|webm|mov|m4v)$/i;

@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  list(@Request() req) {
    return this.chatService.getMyConversations(req.user.userId);
  }

  @Post('conversations')
  start(@Request() req, @Body() body: { userId: string }) {
    if (!body?.userId) throw new BadRequestException('userId required');
    return this.chatService.getOrCreateConversation(req.user.userId, body.userId);
  }

  @Get('conversations/:id/messages')
  getMessages(
    @Request() req,
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.getMessages(
      id,
      req.user.userId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
    );
  }

@Post('conversations/:id/messages')
  sendMessage(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { text?: string; mediaUrl?: string; mediaType?: 'image' | 'video'; replyTo?: string },
  ) {
    if (!body?.text && !body?.mediaUrl) {
      throw new BadRequestException('text or media required');
    }
    return this.chatService.sendMessage(
      id,
      req.user.userId,
      body.text || '',
      body.mediaUrl,
      body.mediaType,
      body.replyTo,
    );
  }

  @Delete('conversations/:id/messages/:messageId')
  deleteMessage(
    @Request() req,
    @Param('id') id: string,
    @Param('messageId') messageId: string,
  ) {
    return this.chatService.deleteMessage(id, req.user.userId, messageId);
  }

  // ✅ Upload media for a DM (returns the Cloudinary URL)
  @Post('conversations/:id/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: mediaStorage,
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  async uploadChatMedia(
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

  @Patch('conversations/:id/read')
  markRead(@Request() req, @Param('id') id: string) {
    return this.chatService.markRead(id, req.user.userId);
  }

  @Get('unread-count')
  unreadCount(@Request() req) {
    return this.chatService.getUnreadTotal(req.user.userId);
  }
}