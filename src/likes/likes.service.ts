import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Like, LikeDocument } from './schemas/like.schema';
import { Wing, WingDocument } from '../wings/schemas/wing.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';

@Injectable()
export class LikesService {
  constructor(
    @InjectModel(Like.name) private likeModel: Model<LikeDocument>,
    @InjectModel(Wing.name) private wingModel: Model<WingDocument>,
    private notificationsService: NotificationsService,
  ) {}

  async like(userId: string, wingId: string) {
    const wing = await this.wingModel.findById(wingId);
    if (!wing) throw new NotFoundException('Wing not found');

    const existing = await this.likeModel.findOne({
      user: new Types.ObjectId(userId),
      wing: new Types.ObjectId(wingId),
    });
    if (existing) throw new ConflictException('Already liked');

    await this.likeModel.create({
      user: new Types.ObjectId(userId),
      wing: new Types.ObjectId(wingId),
    });

    await this.wingModel.findByIdAndUpdate(wingId, {
      $inc: { likesCount: 1 },
    });

    // Notify the wing author
    await this.notificationsService.create(
      wing.author.toString(),
      userId,
      NotificationType.LIKE,
      wingId,
    );

    return { liked: true };
  }

  async unlike(userId: string, wingId: string) {
    const result = await this.likeModel.findOneAndDelete({
      user: new Types.ObjectId(userId),
      wing: new Types.ObjectId(wingId),
    });
    if (!result) throw new NotFoundException('Like not found');

    await this.wingModel.findByIdAndUpdate(wingId, {
      $inc: { likesCount: -1 },
    });

    return { liked: false };
  }

  async getLikers(wingId: string) {
    return this.likeModel
      .find({ wing: new Types.ObjectId(wingId) })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .exec();
  }
}