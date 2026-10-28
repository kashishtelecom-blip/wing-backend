import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Follow, FollowDocument } from './schemas/follow.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';

const DEFAULT_AUTO_VERIFY_THRESHOLD = 50000;

@Injectable()
export class FollowsService {
  constructor(
    @InjectModel(Follow.name) private followModel: Model<FollowDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private notificationsService: NotificationsService,
  ) {}

  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new ConflictException('Cannot follow yourself');
    }
    if (!Types.ObjectId.isValid(followingId)) {
      throw new NotFoundException('Invalid user ID');
    }

    const existing = await this.followModel.findOne({
      follower: new Types.ObjectId(followerId),
      following: new Types.ObjectId(followingId),
    });
    if (existing) {
      throw new ConflictException('Already following');
    }

    await this.followModel.create({
      follower: new Types.ObjectId(followerId),
      following: new Types.ObjectId(followingId),
    });

    await this.notificationsService.create(
      followingId,
      followerId,
      NotificationType.FOLLOW,
    );

    // 🆕 Auto-verify check
    await this.maybeAutoVerify(followingId);

    return { following: true };
  }

  private async maybeAutoVerify(userId: string) {
    try {
      const user = await this.userModel.findById(userId).select('isVerified');
      if (!user || user.isVerified) return; // already verified

      const threshold = parseInt(
        process.env.AUTO_VERIFY_FOLLOWER_THRESHOLD || String(DEFAULT_AUTO_VERIFY_THRESHOLD),
        10,
      );

      const followersCount = await this.followModel.countDocuments({
        following: new Types.ObjectId(userId),
      });

      if (followersCount >= threshold) {
        await this.userModel.findByIdAndUpdate(userId, {
          $set: { isVerified: true },
        });
        console.log(`✅ Auto-verified user ${userId} with ${followersCount} followers`);
      }
    } catch (err) {
      // Non-fatal — don't break the follow action
      console.error('Auto-verify check failed:', err);
    }
  }

  async unfollow(followerId: string, followingId: string) {
    const result = await this.followModel.findOneAndDelete({
      follower: new Types.ObjectId(followerId),
      following: new Types.ObjectId(followingId),
    });
    if (!result) throw new NotFoundException('Not following');
    // Note: does NOT un-verify. Once verified, stays verified.
    return { following: false };
  }

  async getFollowers(userId: string) {
    return this.followModel
      .find({ following: new Types.ObjectId(userId) })
      .populate('follower', 'name username avatarUrl isVerified')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getFollowing(userId: string) {
    return this.followModel
      .find({ follower: new Types.ObjectId(userId) })
      .populate('following', 'name username avatarUrl isVerified')
      .sort({ createdAt: -1 })
      .exec();
  }

  // 🆕 RESTORED: Used by wings.service.ts to build the "Following" feed
  async getFollowedUserIds(userId: string): Promise<string[]> {
    const follows = await this.followModel
      .find({ follower: new Types.ObjectId(userId) })
      .select('following')
      .exec();
    return follows.map((f) => f.following.toString());
  }
}