import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  UseGuards, Request,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('comments')
@Controller('wings/:wingId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(
    @Request() req,
    @Param('wingId') wingId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentsService.create(
      req.user.userId,
      wingId,
      createCommentDto,
    );
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll(@Request() req, @Param('wingId') wingId: string) {
    return this.commentsService.findAllForWing(wingId, req.user?.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commentsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentsService.update(id, req.user.userId, updateCommentDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  remove(@Request() req, @Param('id') id: string) {
    return this.commentsService.remove(id, req.user.userId, req.user.role);
  }

  // ============ COMMENT LIKES ============
  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  like(@Request() req, @Param('id') id: string) {
    return this.commentsService.likeComment(id, req.user.userId);
  }

  @Delete(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  unlike(@Request() req, @Param('id') id: string) {
    return this.commentsService.unlikeComment(id, req.user.userId);
  }
}