import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Repost, RepostDocument } from './schemas/repost.schema';
import { Wing, WingDocument } from '../wings/schemas/wing.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';

@Injectable()
export class RepostsService {
  constructor(
    @InjectModel(Repost.name) private repostModel: Model<RepostDocument>,
    @InjectModel(Wing.name) private wingModel: Model<WingDocument>,
    private notificationsService: NotificationsService,
  ) {}

  async repost(userId: string, wingId: string, quoteText?: string) {
    const wing = await this.wingModel.findById(wingId);
    if (!wing) throw new NotFoundException('Wing not found');

    const existing = await this.repostModel.findOne({
      user: new Types.ObjectId(userId),
      wing: new Types.ObjectId(wingId),
    });
    if (existing) throw new ConflictException('Already reposted');

    await this.repostModel.create({
      user: new Types.ObjectId(userId),
      wing: new Types.ObjectId(wingId),
      quoteText,
    });

    await this.wingModel.findByIdAndUpdate(wingId, {
      $inc: { repostsCount: 1 },
    });

    await this.notificationsService.create(
      wing.author.toString(),
      userId,
      NotificationType.REPOST,
      wingId,
    );

    return { reposted: true, quote: !!quoteText };
  }

  async undoRepost(userId: string, wingId: string) {
    const result = await this.repostModel.findOneAndDelete({
      user: new Types.ObjectId(userId),
      wing: new Types.ObjectId(wingId),
    });
    if (!result) throw new NotFoundException('Not reposted');

    await this.wingModel.findByIdAndUpdate(wingId, {
      $inc: { repostsCount: -1 },
    });

    return { reposted: false };
  }

  async listForWing(wingId: string) {
    return this.repostModel
      .find({ wing: new Types.ObjectId(wingId), deletedAt: null })
      .populate('user', 'name username email isVerified')
      .sort({ createdAt: -1 })
      .exec();
  }

  async listByUser(userId: string) {
    return this.repostModel
      .find({ user: new Types.ObjectId(userId), deletedAt: null })
      .populate({
        path: 'wing',
        populate: { path: 'author', select: 'name username email isVerified' },
      })
      .sort({ createdAt: -1 })
      .exec();
  }
}