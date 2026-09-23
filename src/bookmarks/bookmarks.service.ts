import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Bookmark, BookmarkDocument } from './schemas/bookmark.schema';
import { Wing, WingDocument } from '../wings/schemas/wing.schema';

@Injectable()
export class BookmarksService {
  constructor(
    @InjectModel(Bookmark.name) private bookmarkModel: Model<BookmarkDocument>,
    @InjectModel(Wing.name) private wingModel: Model<WingDocument>,
  ) {}

  async bookmark(userId: string, wingId: string) {
    const wing = await this.wingModel.findById(wingId);
    if (!wing) throw new NotFoundException('Wing not found');

    const existing = await this.bookmarkModel.findOne({
      user: new Types.ObjectId(userId),
      wing: new Types.ObjectId(wingId),
    });
    if (existing) throw new ConflictException('Already bookmarked');

    await this.bookmarkModel.create({
      user: new Types.ObjectId(userId),
      wing: new Types.ObjectId(wingId),
    });
    return { bookmarked: true };
  }

  async unbookmark(userId: string, wingId: string) {
    const result = await this.bookmarkModel.findOneAndDelete({
      user: new Types.ObjectId(userId),
      wing: new Types.ObjectId(wingId),
    });
    if (!result) throw new NotFoundException('Bookmark not found');
    return { bookmarked: false };
  }

  async list(userId: string) {
    return this.bookmarkModel
      .find({ user: new Types.ObjectId(userId) })
      .populate({
        path: 'wing',
        populate: { path: 'author', select: 'name email isVerified' },
      })
      .sort({ createdAt: -1 })
      .exec();
  }
}