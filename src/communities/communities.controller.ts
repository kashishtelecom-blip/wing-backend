import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CommunitiesService } from './communities.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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
    @Body() body: { text: string },
  ) {
    return this.communitiesService.sendMessage(
      id,
      req.user.userId,
      body?.text || '',
    );
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