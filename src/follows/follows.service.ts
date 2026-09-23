import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Follow, FollowDocument } from './schemas/follow.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';


@Injectable()
export class FollowsService {
  constructor(
  @InjectModel(Follow.name) private followModel: Model<FollowDocument>,
  @InjectModel(User.name) private userModel: Model<UserDocument>,
  private notificationsService: NotificationsService,
) {}

  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const target = await this.userModel.findById(followingId);
    if (!target) throw new NotFoundException('User not found');

    const existing = await this.followModel.findOne({
      follower: new Types.ObjectId(followerId),
      following: new Types.ObjectId(followingId),
    });
    if (existing) throw new ConflictException('Already following');

    await this.followModel.create({
      follower: new Types.ObjectId(followerId),
      following: new Types.ObjectId(followingId),
    });

    await this.notificationsService.create(
  followingId,
  followerId,
  NotificationType.FOLLOW,
);

    return { following: true };
  }

  async unfollow(followerId: string, followingId: string) {
    const result = await this.followModel.findOneAndDelete({
      follower: new Types.ObjectId(followerId),
      following: new Types.ObjectId(followingId),
    });
    if (!result) throw new NotFoundException('Not following');

    return { following: false };
  }

  async getFollowers(userId: string) {
    return this.followModel
      .find({ following: new Types.ObjectId(userId) })
      .populate('follower', 'name email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getFollowing(userId: string) {
    return this.followModel
      .find({ follower: new Types.ObjectId(userId) })
      .populate('following', 'name email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getFollowedUserIds(userId: string): Promise<Types.ObjectId[]> {
    const follows = await this.followModel
      .find({ follower: new Types.ObjectId(userId) })
      .select('following')
      .exec();
    return follows.map((f) => f.following);
  }
}