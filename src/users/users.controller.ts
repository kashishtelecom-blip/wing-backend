import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, Request, UseInterceptors, UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { FollowsService } from '../follows/follows.service';
import { BookmarksService } from '../bookmarks/bookmarks.service';
import { RepostsService } from '../reposts/reposts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';


@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly followsService: FollowsService,
    private readonly bookmarksService: BookmarksService,
    private readonly repostsService: RepostsService,
  ) {}

  @Get()
  findAllUsers(@Query('limit') limit?: string) {
    return this.usersService.findAll(limit ? Number(limit) : 50);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getProfile(@Request() req) {
    return this.usersService.findById(req.user.userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.userId, dto);
  }

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `avatar-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
          return callback(new BadRequestException('Only image files allowed'), false);
        }
        callback(null, true);
      },
      limits: { fileSize: 3 * 1024 * 1024 },
    }),
  )
  async uploadAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const avatarUrl = `/uploads/${file.filename}`;
    return this.usersService.updateAvatar(req.user.userId, avatarUrl);
  }

  // ============ SUBSCRIPTION ============
  @Get('me/subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getSubscription(@Request() req) {
    return this.usersService.getSubscriptionStatus(req.user.userId);
  }

  @Post('me/subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  subscribe(@Request() req, @Body() body: { paymentId?: string }) {
    return this.usersService.subscribe(req.user.userId, body?.paymentId);
  }

  @Delete('me/subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  cancelSubscription(@Request() req) {
    return this.usersService.cancelSubscription(req.user.userId);
  }

  // Legacy verify
  @Post('me/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  verifyMe(@Request() req) {
    return this.usersService.verifyUser(req.user.userId);
  }

  @Delete('me/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  unverifyMe(@Request() req) {
    return this.usersService.unverifyUser(req.user.userId);
  }

 // ============ SETTINGS ============
  @Get('me/settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getSettings(@Request() req) {
    return this.usersService.getSettings(req.user.userId);
  }

  @Patch('me/settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateSettings(@Request() req, @Body() dto: UpdateSettingsDto) {
    return this.usersService.updateSettings(req.user.userId, dto);
  }

  // ============ BLOCKED USERS ============
  @Get('me/blocked')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getBlocked(@Request() req) {
    return this.usersService.getBlockedUsers(req.user.userId);
  }

  @Post('me/block/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  blockUser(@Request() req, @Param('userId') userId: string) {
    return this.usersService.blockUser(req.user.userId, userId);
  }

  @Delete('me/block/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  unblockUser(@Request() req, @Param('userId') userId: string) {
    return this.usersService.unblockUser(req.user.userId, userId);
  }

  // ============ MUTED USERS ============
  @Get('me/muted')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getMuted(@Request() req) {
    return this.usersService.getMutedUsers(req.user.userId);
  }

  @Post('me/mute/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  muteUser(@Request() req, @Param('userId') userId: string) {
    return this.usersService.muteUser(req.user.userId, userId);
  }

  @Delete('me/mute/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  unmuteUser(@Request() req, @Param('userId') userId: string) {
    return this.usersService.unmuteUser(req.user.userId, userId);
  }

  // ============ ACCOUNT ============
  @Post('me/deactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  deactivateAccount(@Request() req) {
    return this.usersService.deactivateAccount(req.user.userId);
  }

  @Post('me/reactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  reactivateAccount(@Request() req) {
    return this.usersService.reactivateAccount(req.user.userId);
  }

  @Get('me/export')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  exportData(@Request() req) {
    return this.usersService.exportData(req.user.userId);
  }

  @Get('me/bookmarks')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  myBookmarks(@Request() req) {
    return this.bookmarksService.list(req.user.userId);
  }

  @Get('me/reposts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  myReposts(@Request() req) {
    return this.repostsService.listByUser(req.user.userId);
  }

  @Post('me/pin/:wingId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  pinWing(@Request() req, @Param('wingId') wingId: string) {
    return this.usersService.pinWing(req.user.userId, wingId);
  }

  @Delete('me/pin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  unpinWing(@Request() req) {
    return this.usersService.unpinWing(req.user.userId);
  }

  @Post('backfill-usernames')
  backfillUsernames() {
    return this.usersService.backfillUsernames();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  follow(@Request() req, @Param('id') id: string) {
    return this.followsService.follow(req.user.userId, id);
  }

  @Delete(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  unfollow(@Request() req, @Param('id') id: string) {
    return this.followsService.unfollow(req.user.userId, id);
  }

  @Get(':id/followers')
  getFollowers(@Param('id') id: string) {
    return this.followsService.getFollowers(id);
  }

  @Get(':id/following')
  getFollowing(@Param('id') id: string) {
    return this.followsService.getFollowing(id);
  }
}