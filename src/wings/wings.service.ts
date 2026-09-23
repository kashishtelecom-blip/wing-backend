import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wing, WingDocument } from './schemas/wing.schema';
import { WingEdit, WingEditDocument } from './schemas/wing-edit.schema';
import { CopyrightReport, CopyrightReportDocument } from './schemas/copyright-report.schema';
import { PollVote, PollVoteDocument } from './schemas/poll-vote.schema';
import { CreateWingDto } from './dto/create-wing.dto';
import { UpdateWingDto } from './dto/update-wing.dto';
import { FindAllWingsDto } from './dto/find-all-wings.dto';
import { FollowsService } from '../follows/follows.service';
import { User, UserDocument } from '../users/schemas/user.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';
import { extractHashtags, extractMentionUsernames } from './utils/text-parser';

@Injectable()
export class WingsService {
   constructor(
    @InjectModel(Wing.name) private wingModel: Model<WingDocument>,
    @InjectModel(WingEdit.name)
    private wingEditModel: Model<WingEditDocument>,
    @InjectModel(PollVote.name)
    private pollVoteModel: Model<PollVoteDocument>,
    @InjectModel(CopyrightReport.name)
    private copyrightModel: Model<CopyrightReportDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private followsService: FollowsService,
    private notificationsService: NotificationsService,
  ) {}

async reportCopyright(
    wingId: string,
    reporterId: string,
    data: { reporterEmail: string; reason: string; originalWorkUrl: string; description: string },
  ) {
    const wing = await this.wingModel.findById(wingId);
    if (!wing) throw new NotFoundException('Wing not found');

    const report = await this.copyrightModel.create({
      wing: new Types.ObjectId(wingId),
      reporter: new Types.ObjectId(reporterId),
      reporterEmail: data.reporterEmail,
      reason: data.reason,
      originalWorkUrl: data.originalWorkUrl,
      description: data.description,
    });

    return { success: true, reportId: report._id, message: 'Report submitted. Our team will review within 48 hours.' };
  }

  async getCopyrightReports(userId: string, isAdmin: boolean) {
    if (!isAdmin) {
      return this.copyrightModel
        .find({ reporter: new Types.ObjectId(userId) })
        .populate('wing', 'title content')
        .sort({ createdAt: -1 })
        .exec();
    }
    return this.copyrightModel
      .find()
      .populate('wing', 'title content')
      .populate('reporter', 'username email')
      .sort({ createdAt: -1 })
      .exec();
  }
// ============================================
  // ANONYMOUS MASKING
  // ============================================
  private maskAnonymous(wing: any) {
    if (!wing) return wing;
    const obj = wing.toObject ? wing.toObject() : wing;
    if (obj.isAnonymous) {
      obj.author = {
        _id: null,
        username: 'anonymous',
        name: 'Anonymous',
        avatarUrl: '',
        isVerified: false,
      };
    }
    return obj;
  }

  private maskAnonymousList(wings: any[]) {
    return wings.map((w) => this.maskAnonymous(w));
  }

  // ============================================
  // CREATE
  // ============================================
  async create(userId: string, createWingDto: CreateWingDto): Promise<Wing> {
    const text = createWingDto.title + ' ' + createWingDto.content;
    const hashtags = extractHashtags(text);
    const mentionUsernames = extractMentionUsernames(text);

    let mentionedUserIds: Types.ObjectId[] = [];
    if (mentionUsernames.length > 0) {
      const users = await this.userModel
        .find({ username: { $in: mentionUsernames } })
        .select('_id')
        .exec();
      mentionedUserIds = users.map((u) => u._id as Types.ObjectId);
    }

    let pollData: any = null;
    if (createWingDto.poll) {
      if (createWingDto.poll.options.length < 2) {
        throw new BadRequestException('Poll needs at least 2 options');
      }
      if (createWingDto.poll.options.length > 6) {
        throw new BadRequestException('Poll can have at most 6 options');
      }
      pollData = {
        question: createWingDto.poll.question,
        options: createWingDto.poll.options.map((o) => ({ text: o.text, votes: 0 })),
        endsAt: new Date(createWingDto.poll.endsAt),
        totalVotes: 0,
      };
    }

    const scheduledDate = createWingDto.scheduledAt
      ? new Date(createWingDto.scheduledAt)
      : null;
    const isScheduled = scheduledDate !== null && scheduledDate > new Date();

    const newWing = new this.wingModel({
      title: createWingDto.title,
      content: createWingDto.content,
      poll: pollData,
      author: new Types.ObjectId(userId),
      isAnonymous: createWingDto.isAnonymous || false,
      commentsEnabled: createWingDto.commentsEnabled !== false,
      scheduledAt: scheduledDate,
      isPublished: isScheduled ? false : createWingDto.isPublished !== false,
      hashtags,
      mentions: mentionedUserIds,
    });
    const saved = await newWing.save();

    if (!isScheduled) {
      for (const mentionedId of mentionedUserIds) {
        await this.notificationsService.create(
          mentionedId.toString(),
          userId,
          NotificationType.MENTION,
          saved._id.toString(),
        );
      }
    }

    return saved;
  }

  // ============================================
  // DRAFTS
  // ============================================
  async createDraft(userId: string, dto: CreateWingDto) {
    const text = (dto.title || '') + ' ' + (dto.content || '');
    const newWing = new this.wingModel({
      title: dto.title || 'Untitled draft',
      content: dto.content || '',
      author: new Types.ObjectId(userId),
      isDraft: true,
      isPublished: false,
      hashtags: extractHashtags(text),
    });
    return newWing.save();
  }

  async getMyDrafts(userId: string) {
    return this.wingModel
      .find({ author: new Types.ObjectId(userId), isDraft: true })
      .sort({ updatedAt: -1 })
      .exec();
  }

  async publishDraft(id: string, userId: string) {
    const wing = await this.wingModel.findOne({
      _id: id,
      author: new Types.ObjectId(userId),
      isDraft: true,
    });
    if (!wing) throw new NotFoundException('Draft not found');
    wing.isDraft = false;
    wing.isPublished = true;
    return wing.save();
  }

  // ============================================
  // SCHEDULED PUBLISHING (called by cron)
  // ============================================
  async publishScheduledWings(): Promise<number> {
    const now = new Date();
    const pending = await this.wingModel.find({
      scheduledAt: { $lte: now, $ne: null },
      isPublished: false,
      isDraft: false,
      deletedAt: null,
    });

    let count = 0;
    for (const wing of pending) {
      wing.isPublished = true;
      await wing.save();
      count++;

      // Send mention notifications now that it's live
      if (wing.mentions && wing.mentions.length > 0) {
        for (const mentionedId of wing.mentions) {
          await this.notificationsService.create(
            mentionedId.toString(),
            wing.author.toString(),
            NotificationType.MENTION,
            wing._id.toString(),
          );
        }
      }
    }
    return count;
  }

  // ============================================
  // READ
  // ============================================
  async findAllPaginated(query: FindAllWingsDto): Promise<{
    data: Wing[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { search } = query;
    const skip = (page - 1) * limit;

    let filter: any = {
      deletedAt: null,
      isDraft: { $ne: true },
      isPublished: true,
        };
    if (search) {
      filter = {
        deletedAt: null,
        isDraft: { $ne: true },
        isPublished: true,
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
        ],
      };
    }

    const [data, total] = await Promise.all([
      this.wingModel
        .find(filter)
        .populate('author', 'name username email isVerified avatarUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.wingModel.countDocuments(filter),
    ]);

   return { data: this.maskAnonymousList(data), total, page, limit };
  }

  async findOne(id: string): Promise<Wing> {
    const wing = await this.wingModel
      .findOneAndUpdate(
        { _id: id, deletedAt: null, isDraft: { $ne: true } },
        { $inc: { views: 1 } },
        { returnDocument: 'after' },
      )
      .populate('author', 'name username email isVerified avatarUrl')
      .exec();
    if (!wing) throw new NotFoundException('Wing not found');
    return this.maskAnonymous(wing);
  }

  // ============================================
  // UPDATE (with edit history)
  // ============================================
  async update(
    id: string,
    userId: string,
    updateWingDto: UpdateWingDto,
  ): Promise<Wing> {
    const wing = await this.wingModel.findOne({ _id: id, deletedAt: null });
    if (!wing) throw new NotFoundException('Wing not found');
    if (wing.author.toString() !== userId) {
      throw new ForbiddenException('You can only update your own wings');
    }

    const nextVersion = (wing.editCount || 0) + 1;
    await this.wingEditModel.create({
      wing: wing._id,
      editor: new Types.ObjectId(userId),
      previousTitle: wing.title,
      previousContent: wing.content,
      version: nextVersion,
    });

    Object.assign(wing, updateWingDto);

    const text = wing.title + ' ' + wing.content;
    wing.hashtags = extractHashtags(text);
    const mentionUsernames = extractMentionUsernames(text);
    if (mentionUsernames.length > 0) {
      const users = await this.userModel
        .find({ username: { $in: mentionUsernames } })
        .select('_id')
        .exec();
      wing.mentions = users.map((u) => u._id as Types.ObjectId);
    } else {
      wing.mentions = [];
    }

    wing.editedAt = new Date();
    wing.editCount = nextVersion;

    return wing.save();
  }

  async getEditHistory(wingId: string) {
    return this.wingEditModel
      .find({ wing: new Types.ObjectId(wingId) })
      .populate('editor', 'name username email')
      .sort({ version: -1 })
      .exec();
  }

  // ============================================
  // DELETE
  // ============================================
  async remove(id: string, userId: string): Promise<void> {
    const wing = await this.wingModel.findOne({ _id: id, deletedAt: null });
    if (!wing) throw new NotFoundException('Wing not found');
    if (wing.author.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own wings');
    }
    wing.deletedAt = new Date();
    await wing.save();
  }

  async updateImage(
    id: string,
    userId: string,
    imageUrl: string,
  ): Promise<Wing> {
    const wing = await this.wingModel.findOne({ _id: id, deletedAt: null });
    if (!wing) throw new NotFoundException('Wing not found');
    if (wing.author.toString() !== userId) {
      throw new ForbiddenException('You can only update your own wings');
    }
    wing.imageUrl = imageUrl;
    wing.videoUrl = undefined;
    return wing.save();
  }

  async updateVideo(
    id: string,
    userId: string,
    videoUrl: string,
  ): Promise<Wing> {
    const wing = await this.wingModel.findOne({ _id: id, deletedAt: null });
    if (!wing) throw new NotFoundException('Wing not found');
    if (wing.author.toString() !== userId) {
      throw new ForbiddenException('You can only update your own wings');
    }
    wing.videoUrl = videoUrl;
    wing.imageUrl = undefined;
    return wing.save();
  }

  // ============================================
  // FEED
  // ============================================
  async getFeed(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: Wing[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;

    const followedIds = await this.followsService.getFollowedUserIds(userId);
    const authorIds = [...followedIds, new Types.ObjectId(userId)];

    // Get blocked + muted users to exclude from feed
    const me = await this.userModel.findById(userId).select('blockedUsers mutedUsers');
    const blockedIds = (me?.blockedUsers || []).map((id) => new Types.ObjectId(id.toString()));
    const mutedIds = (me?.mutedUsers || []).map((id) => new Types.ObjectId(id.toString()));
    const excludeIds = [...blockedIds, ...mutedIds];

    const filter: any = {
      deletedAt: null,
      isPublished: true,
      isDraft: { $ne: true },
      author: { $in: authorIds },
    };

    if (excludeIds.length > 0) {
      filter.author = { $in: authorIds, $nin: excludeIds };
    }

    const [data, total] = await Promise.all([
      this.wingModel
        .find(filter)
        .populate('author', 'name username email isVerified avatarUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.wingModel.countDocuments(filter),
    ]);

     return { data: this.maskAnonymousList(data), total, page, limit };
  }

  // ============================================
  // HASHTAGS
  // ============================================
  async findByHashtag(
    tag: string,
    page = 1,
    limit = 10,
  ): Promise<{
    data: Wing[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const filter = {
      hashtags: tag.toLowerCase(),
      deletedAt: null,
      isDraft: { $ne: true },
      isPublished: true,
    };

    const [data, total] = await Promise.all([
      this.wingModel
        .find(filter)
        .populate('author', 'name username email isVerified avatarUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.wingModel.countDocuments(filter),
    ]);

     return { data: this.maskAnonymousList(data), total, page, limit };
  }

  async getTrendingHashtags(limit = 10) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const result = await this.wingModel.aggregate([
      {
        $match: {
          createdAt: { $gte: since },
          deletedAt: null,
          isDraft: { $ne: true },
        },
      },
      { $unwind: '$hashtags' },
      {
        $group: {
          _id: '$hashtags',
          count: { $sum: 1 },
          totalLikes: { $sum: '$likesCount' },
          totalViews: { $sum: '$views' },
        },
      },
      {
        $addFields: {
          score: {
            $add: [
              '$count',
              { $multiply: ['$totalLikes', 3] },
              { $multiply: ['$totalViews', 0.1] },
            ],
          },
        },
      },
      { $sort: { score: -1 } },
      { $limit: limit },
      { $project: { _id: 0, hashtag: '$_id', count: 1, score: 1 } },
    ]);

    return result;
  }

  // ============================================
  // POLLS
  // ============================================
  async votePoll(wingId: string, userId: string, optionIndex: number) {
    const wing = await this.wingModel.findOne({
      _id: wingId,
      deletedAt: null,
    });
    if (!wing) throw new NotFoundException('Wing not found');
    if (!wing.poll) throw new BadRequestException('This wing has no poll');
    if (new Date() > wing.poll.endsAt) {
      throw new BadRequestException('Poll has ended');
    }
    if (optionIndex < 0 || optionIndex >= wing.poll.options.length) {
      throw new BadRequestException('Invalid option index');
    }

    const existing = await this.pollVoteModel.findOne({
      wing: new Types.ObjectId(wingId),
      user: new Types.ObjectId(userId),
    });

    if (existing) {
      if (existing.optionIndex === optionIndex) {
        wing.poll.options[existing.optionIndex].votes -= 1;
        wing.poll.totalVotes -= 1;
        await existing.deleteOne();
        wing.markModified('poll');
        await wing.save();
        return { voted: false, optionIndex };
      }
      wing.poll.options[existing.optionIndex].votes -= 1;
      wing.poll.options[optionIndex].votes += 1;
      existing.optionIndex = optionIndex;
      await existing.save();
      wing.markModified('poll');
      await wing.save();
      return { voted: true, optionIndex, changed: true };
    }

    await this.pollVoteModel.create({
      wing: new Types.ObjectId(wingId),
      user: new Types.ObjectId(userId),
      optionIndex,
    });
    wing.poll.options[optionIndex].votes += 1;
    wing.poll.totalVotes += 1;
    wing.markModified('poll');
    await wing.save();
    return { voted: true, optionIndex };
  }

  async getPollResults(wingId: string) {
    const wing = await this.wingModel.findOne({
      _id: wingId,
      deletedAt: null,
    });
    if (!wing) throw new NotFoundException('Wing not found');
    if (!wing.poll) throw new BadRequestException('This wing has no poll');

    return {
      question: wing.poll.question,
      options: wing.poll.options,
      totalVotes: wing.poll.totalVotes,
      endsAt: wing.poll.endsAt,
      isActive: new Date() < wing.poll.endsAt,
    };
  }
}