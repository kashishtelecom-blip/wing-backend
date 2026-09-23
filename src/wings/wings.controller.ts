import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  UseGuards, Request, Query, UseInterceptors, UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { WingsService } from './wings.service';
import { LikesService } from '../likes/likes.service';
import { BookmarksService } from '../bookmarks/bookmarks.service';
import { RepostsService } from '../reposts/reposts.service';
import { CreateWingDto } from './dto/create-wing.dto';
import { UpdateWingDto } from './dto/update-wing.dto';
import { FindAllWingsDto } from './dto/find-all-wings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const IMAGE_EXT = /\.(jpg|jpeg|png|gif|webp)$/i;
const VIDEO_EXT = /\.(mp4|webm|mov|m4v)$/i;

@ApiTags('wings')
@Controller('wings')
export class WingsController {
  constructor(
    private readonly wingsService: WingsService,
    private readonly likesService: LikesService,
    private readonly bookmarksService: BookmarksService,
    private readonly repostsService: RepostsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@Request() req, @Body() createWingDto: CreateWingDto) {
    return this.wingsService.create(req.user.userId, createWingDto);
  }

  @Get()
  findAll(@Query() query: FindAllWingsDto) {
    return this.wingsService.findAllPaginated(query);
  }

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getFeed(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.wingsService.getFeed(req.user.userId, Number(page), Number(limit));
  }

  @Post('drafts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createDraft(@Request() req, @Body() createWingDto: CreateWingDto) {
    return this.wingsService.createDraft(req.user.userId, createWingDto);
  }

  @Get('drafts/mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  myDrafts(@Request() req) {
    return this.wingsService.getMyDrafts(req.user.userId);
  }

  @Post('drafts/:id/publish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  publishDraft(@Request() req, @Param('id') id: string) {
    return this.wingsService.publishDraft(id, req.user.userId);
  }

  @Get('trending/hashtags')
  getTrendingHashtags(@Query('limit') limit: number = 10) {
    return this.wingsService.getTrendingHashtags(Number(limit));
  }

  @Get('hashtag/:tag')
  findByHashtag(
    @Param('tag') tag: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.wingsService.findByHashtag(tag, Number(page), Number(limit));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.wingsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateWingDto: UpdateWingDto,
  ) {
    return this.wingsService.update(id, req.user.userId, updateWingDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  remove(@Request() req, @Param('id') id: string) {
    return this.wingsService.remove(id, req.user.userId);
  }

  @Get(':id/history')
  getEditHistory(@Param('id') id: string) {
    return this.wingsService.getEditHistory(id);
  }

@Post(':id/report-copyright')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  reportCopyright(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { reporterEmail: string; reason: string; originalWorkUrl: string; description: string },
  ) {
    return this.wingsService.reportCopyright(id, req.user.userId, body);
  }

  @Post(':id/poll/vote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  votePoll(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { optionIndex: number },
  ) {
    return this.wingsService.votePoll(id, req.user.userId, body.optionIndex);
  }

  @Get(':id/poll')
  getPoll(@Param('id') id: string) {
    return this.wingsService.getPollResults(id);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  like(@Request() req, @Param('id') id: string) {
    return this.likesService.like(req.user.userId, id);
  }

  @Delete(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  unlike(@Request() req, @Param('id') id: string) {
    return this.likesService.unlike(req.user.userId, id);
  }

  @Get(':id/likes')
  getLikers(@Param('id') id: string) {
    return this.likesService.getLikers(id);
  }

  @Post(':id/repost')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  repost(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { quoteText?: string },
  ) {
    return this.repostsService.repost(req.user.userId, id, body?.quoteText);
  }

  @Delete(':id/repost')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  undoRepost(@Request() req, @Param('id') id: string) {
    return this.repostsService.undoRepost(req.user.userId, id);
  }

  @Get(':id/reposts')
  listReposts(@Param('id') id: string) {
    return this.repostsService.listForWing(id);
  }

  @Post(':id/bookmark')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  bookmark(@Request() req, @Param('id') id: string) {
    return this.bookmarksService.bookmark(req.user.userId, id);
  }

  @Delete(':id/bookmark')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  unbookmark(@Request() req, @Param('id') id: string) {
    return this.bookmarksService.unbookmark(req.user.userId, id);
  }

  @Post(':id/upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, 'media-' + uniqueSuffix + ext);
        },
      }),
      fileFilter: (req, file, callback) => {
        const isImage = IMAGE_EXT.test(file.originalname);
        const isVideo = VIDEO_EXT.test(file.originalname);
        if (!isImage && !isVideo) {
          return callback(
            new BadRequestException('Only image (jpg/png/gif/webp) or video (mp4/webm/mov) allowed'),
            false,
          );
        }
        callback(null, true);
      },
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  async uploadMedia(
    @Request() req,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const mediaUrl = '/uploads/' + file.filename;
    const isVideo = VIDEO_EXT.test(file.originalname);
    if (isVideo) {
      return this.wingsService.updateVideo(id, req.user.userId, mediaUrl);
    }
    return this.wingsService.updateImage(id, req.user.userId, mediaUrl);
  }
}