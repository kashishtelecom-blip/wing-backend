import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BusinessPage, BusinessPageDocument } from './schemas/business-page.schema';

@Injectable()
export class BusinessService {
  constructor(
    @InjectModel(BusinessPage.name) private pageModel: Model<BusinessPageDocument>,
  ) {}

  async create(ownerId: string, data: { name: string; slug: string; description?: string; category?: string }) {
    const existing = await this.pageModel.findOne({ slug: data.slug.toLowerCase() });
    if (existing) throw new ConflictException('Page URL (slug) is already taken');

    return this.pageModel.create({
      ...data,
      slug: data.slug.toLowerCase(),
      owner: new Types.ObjectId(ownerId),
      followers: [new Types.ObjectId(ownerId)],
    });
  }

  async getMyPages(ownerId: string) {
    return this.pageModel.find({ owner: new Types.ObjectId(ownerId) }).exec();
  }

  async getPageBySlug(slug: string) {
    const page = await this.pageModel.findOne({ slug: slug.toLowerCase() }).exec();
    if (!page) throw new NotFoundException('Page not found');
    return page;
  }

  async toggleFollow(slug: string, userId: string) {
    const page = await this.getPageBySlug(slug);
    const uid = new Types.ObjectId(userId);
    const isFollowing = page.followers.some((id) => id.toString() === userId);

    if (isFollowing) {
      await this.pageModel.findByIdAndUpdate(page._id, { $pull: { followers: uid } });
      return { following: false };
    } else {
      await this.pageModel.findByIdAndUpdate(page._id, { $addToSet: { followers: uid } });
      return { following: true };
    }
  }
}