import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Wing, WingDocument } from '../wings/schemas/wing.schema';

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Wing.name) private wingModel: Model<WingDocument>,
  ) {}

  async searchUsers(q: string, limit = 20) {
    if (!q || q.trim().length === 0) return [];
    const regex = new RegExp(q.trim(), 'i');
    return this.userModel
      .find({
        $or: [
          { username: regex },
          { name: regex },
          { email: regex },
        ],
      })
      .select('-password')
      .limit(limit)
      .exec();
  }

  async searchWings(q: string, limit = 20) {
    if (!q || q.trim().length === 0) return { data: [], total: 0 };
    const regex = new RegExp(q.trim(), 'i');
    const filter = {
      deletedAt: null,
      isDraft: { $ne: true },
      isPublished: true,
      $or: [
        { title: regex },
        { content: regex },
        { hashtags: q.toLowerCase().replace('#', '') },
      ],
    };
    const [data, total] = await Promise.all([
      this.wingModel
        .find(filter)
        .populate('author', 'name username email isVerified avatarUrl')
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec(),
      this.wingModel.countDocuments(filter),
    ]);
    return { data, total, page: 1, limit };
  }

  async searchAll(q: string) {
    const [users, wings] = await Promise.all([
      this.searchUsers(q, 10),
      this.searchWings(q, 20),
    ]);
    return { users, wings };
  }
}