import {
  Controller, Get, Post, Patch, Param, Body, Query,
  UseGuards, Request, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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
  sendMessage(@Request() req, @Param('id') id: string, @Body() body: { text: string }) {
    if (!body?.text) throw new BadRequestException('text required');
    return this.chatService.sendMessage(id, req.user.userId, body.text);
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