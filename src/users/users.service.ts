import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument, SubscriptionTier } from './schemas/user.schema';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';

const VERIFIED_PRICE_INR = 199;
const VERIFIED_DURATION_DAYS = 30;

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  private async autoExpire(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) return;
    if (user.isVerified && user.verifiedUntil && new Date(user.verifiedUntil) < new Date()) {
      user.isVerified = false;
      user.subscriptionTier = SubscriptionTier.FREE;
      user.verifiedUntil = null;
      await user.save();
    }
  }

  async findAll(limit = 50, excludeId?: string) {
    const filter = excludeId ? { _id: { $ne: new Types.ObjectId(excludeId) } } : {};
    return this.userModel
      .find(filter)
      .select('-password')
      .sort({ isVerified: -1, createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async findById(id: string): Promise<any> {
    await this.autoExpire(id);
    const user = await this.userModel
      .findById(id)
      .select('-password')
      .populate({
        path: 'pinnedWing',
        populate: { path: 'author', select: 'name username email isVerified avatarUrl' },
      })
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByUsername(username: string): Promise<any> {
    const existing = await this.userModel.findOne({ username: username.toLowerCase() });
    if (existing) await this.autoExpire(existing._id.toString());
    const user = await this.userModel
      .findOne({ username: username.toLowerCase() })
      .select('-password')
      .populate({
        path: 'pinnedWing',
        populate: { path: 'author', select: 'name username email isVerified avatarUrl' },
      })
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { $set: dto }, { returnDocument: 'after' })
      .select('-password')
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { avatarUrl }, { returnDocument: 'after' })
      .select('-password')
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // ============ SUBSCRIPTION ============
  async subscribe(userId: string, paymentId?: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    const baseDate =
      user.verifiedUntil && new Date(user.verifiedUntil) > new Date()
        ? new Date(user.verifiedUntil)
        : new Date();
    const newExpiry = new Date(baseDate);
    newExpiry.setDate(newExpiry.getDate() + VERIFIED_DURATION_DAYS);
    user.isVerified = true;
    user.verifiedUntil = newExpiry;
    user.subscriptionTier = SubscriptionTier.VERIFIED;
    await user.save();
    return {
      success: true,
      message: 'Subscription activated',
      paymentId: paymentId || 'mock_' + Date.now(),
      amount: VERIFIED_PRICE_INR,
      currency: 'INR',
      verifiedUntil: newExpiry,
      tier: SubscriptionTier.VERIFIED,
    };
  }

  async cancelSubscription(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (!user.isVerified) throw new BadRequestException('No active subscription');
    user.isVerified = false;
    user.verifiedUntil = null;
    user.subscriptionTier = SubscriptionTier.FREE;
    await user.save();
    return { success: true, message: 'Subscription cancelled' };
  }

  async getSubscriptionStatus(userId: string) {
    const user = await this.userModel.findById(userId).select('-password').exec();
    if (!user) throw new NotFoundException('User not found');
    const now = new Date();
    const isActive = user.isVerified && user.verifiedUntil && new Date(user.verifiedUntil) > now;
    const daysLeft = isActive
      ? Math.ceil((new Date(user.verifiedUntil!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    return {
      tier: user.subscriptionTier,
      isVerified: user.isVerified,
      isActive,
      verifiedUntil: user.verifiedUntil,
      daysLeft,
      price: VERIFIED_PRICE_INR,
      currency: 'INR',
      billingCycle: 'monthly',
    };
  }

  async verifyUser(userId: string) {
    return this.userModel
      .findByIdAndUpdate(userId, { isVerified: true }, { returnDocument: 'after' })
      .select('-password')
      .exec();
  }

  async unverifyUser(userId: string) {
    return this.userModel
      .findByIdAndUpdate(userId, { isVerified: false }, { returnDocument: 'after' })
      .select('-password')
      .exec();
  }

  async pinWing(userId: string, wingId: string) {
    await this.userModel.findByIdAndUpdate(userId, { pinnedWing: new Types.ObjectId(wingId) });
    return { pinned: true };
  }

  async unpinWing(userId: string) {
    await this.userModel.findByIdAndUpdate(userId, { pinnedWing: null });
    return { pinned: false };
  }

  async backfillUsernames() {
    const users = await this.userModel.find({
      $or: [{ username: { $exists: false } }, { username: null }, { username: '' }],
    });
    const results: Array<{ email: string; username: string }> = [];
    for (const user of users) {
      const prefix = user.email.split('@')[0].toLowerCase();
      user.username = prefix;
      await user.save();
      results.push({ email: user.email, username: user.username });
    }
    return { updated: results.length, users: results };
  }

  // ============ SETTINGS ============
  async getSettings(userId: string) {
    const user = await this.userModel.findById(userId).select('settings').exec();
    if (!user) throw new NotFoundException('User not found');
    return user.settings || {
      privacy: { privateAccount: false, showActivity: true, allowDMsFrom: 'everyone' },
      notifications: {
        inAppNotifications: true,
        emailOnMention: true,
        emailOnFollow: false,
        emailOnLike: false,
      },
      content: { showSensitiveContent: false, autoplayVideos: true },
    };
  }

  async updateSettings(userId: string, dto: UpdateSettingsDto) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const current = user.settings || {
      privacy: { privateAccount: false, showActivity: true, allowDMsFrom: 'everyone' },
      notifications: {
        inAppNotifications: true,
        emailOnMention: true,
        emailOnFollow: false,
        emailOnLike: false,
      },
      content: { showSensitiveContent: false, autoplayVideos: true },
    };

    user.settings = {
      privacy: { ...current.privacy, ...(dto.privacy || {}) },
      notifications: { ...current.notifications, ...(dto.notifications || {}) },
      content: { ...current.content, ...(dto.content || {}) },
    };

    await user.save();
    return user.settings;
  }

  async blockUser(userId: string, targetId: string) {
    if (userId === targetId) throw new BadRequestException('Cannot block yourself');
    await this.userModel.findByIdAndUpdate(userId, {
      $addToSet: { blockedUsers: new Types.ObjectId(targetId) },
      $pull: { mutedUsers: new Types.ObjectId(targetId) },
    });
    return { blocked: true };
  }

  async unblockUser(userId: string, targetId: string) {
    await this.userModel.findByIdAndUpdate(userId, {
      $pull: { blockedUsers: new Types.ObjectId(targetId) },
    });
    return { blocked: false };
  }

  async muteUser(userId: string, targetId: string) {
    if (userId === targetId) throw new BadRequestException('Cannot mute yourself');
    await this.userModel.findByIdAndUpdate(userId, {
      $addToSet: { mutedUsers: new Types.ObjectId(targetId) },
    });
    return { muted: true };
  }

  async unmuteUser(userId: string, targetId: string) {
    await this.userModel.findByIdAndUpdate(userId, {
      $pull: { mutedUsers: new Types.ObjectId(targetId) },
    });
    return { muted: false };
  }

  async getBlockedUsers(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .populate('blockedUsers', 'name username avatarUrl isVerified')
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user.blockedUsers || [];
  }

  async getMutedUsers(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .populate('mutedUsers', 'name username avatarUrl isVerified')
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user.mutedUsers || [];
  }

  async deactivateAccount(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    user.isActive = false;
    user.deactivatedAt = new Date();
    await user.save();
    return { success: true, message: 'Account deactivated' };
  }

  async reactivateAccount(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    user.isActive = true;
    user.deactivatedAt = null;
    await user.save();
    return { success: true, message: 'Account reactivated' };
  }

  async exportData(userId: string) {
    const user = await this.userModel.findById(userId).select('-password').exec();
    if (!user) throw new NotFoundException('User not found');
    return {
      profile: user.toObject(),
      exportedAt: new Date().toISOString(),
      note: 'This is your personal data export from Wing.',
    };
  }
}