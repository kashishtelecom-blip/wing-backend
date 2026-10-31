import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
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

      // 👇 NEW: Check if the page should be auto-verified
      const threshold = parseInt(process.env.AUTO_VERIFY_PAGE_THRESHOLD || '50000', 10);
      
      if (page.followers.length + 1 >= threshold && !page.isVerified) {
        await this.pageModel.findByIdAndUpdate(page._id, { isVerified: true });
        console.log(`✅ Auto-verified Business Page: ${page.name} with ${page.followers.length + 1} followers`);
      }

      return { following: true };
    }
  }

  async updatePage(slug: string, userId: string, data: { name?: string; description?: string; category?: string }) {
    const page = await this.getPageBySlug(slug);
    if (page.owner.toString() !== userId) {
      throw new ForbiddenException('Not authorized');
    }
    return this.pageModel.findByIdAndUpdate(
      page._id,
      { $set: data },
      { returnDocument: 'after' },
    );
  }

  async updateAvatar(slug: string, userId: string, avatarUrl: string) {
    const page = await this.getPageBySlug(slug);
    if (page.owner.toString() !== userId) {
      throw new ForbiddenException('Not authorized');
    }
    return this.pageModel.findByIdAndUpdate(
      page._id,
      { avatarUrl },
      { returnDocument: 'after' },
    );
  }

  async updateCover(slug: string, userId: string, coverUrl: string) {
    const page = await this.getPageBySlug(slug);
    if (page.owner.toString() !== userId) {
      throw new ForbiddenException('Not authorized');
    }
    return this.pageModel.findByIdAndUpdate(
      page._id,
      { coverUrl },
      { returnDocument: 'after' },
    );
  }
}