import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Story, StoryDocument } from './schemas/story.schema';

@Injectable()
export class StoriesService {
  constructor(
    @InjectModel(Story.name) private storyModel: Model<StoryDocument>,
  ) {}

  async create(userId: string, mediaUrl: string, mediaType: 'image' | 'video') {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const story = await this.storyModel.create({
      author: new Types.ObjectId(userId),
      mediaUrl,
      mediaType,
      expiresAt,
    });

    return story;
  }

  async getFeed(currentUserId: string) {
    const now = new Date();
    
    const stories = await this.storyModel
      .find({ expiresAt: { $gt: now } })
      .populate('author', 'name username avatarUrl isVerified')
      .sort({ createdAt: -1 })
      .exec();

    const groupedStories = new Map<string, any>();

    for (const story of stories) {
      const author: any = story.author;
      if (!author) continue;

      const authorId = author._id.toString();
      
      if (!groupedStories.has(authorId)) {
        groupedStories.set(authorId, {
          author: {
            _id: author._id,
            name: author.name,
            username: author.username,
            avatarUrl: author.avatarUrl,
            isVerified: author.isVerified,
          },
          stories: [],
          hasUnseen: false,
        });
      }

      // EXPLICIT TYPING for the .some() callback
      const hasViewed = story.views.some((id: Types.ObjectId) => id.toString() === currentUserId);

      groupedStories.get(authorId).stories.push({
        _id: story._id,
        mediaUrl: story.mediaUrl,
        mediaType: story.mediaType,
        createdAt: (story as any).createdAt,
        hasViewed,
      });

      if (!hasViewed) {
        groupedStories.get(authorId).hasUnseen = true;
      }
    }

    return Array.from(groupedStories.values());
  }

  async markViewed(storyId: string, userId: string) {
    if (!Types.ObjectId.isValid(storyId)) return { viewed: false };
    await this.storyModel.findByIdAndUpdate(
      storyId,
      { $addToSet: { views: new Types.ObjectId(userId) } }
    );
    return { viewed: true };
  }

  async delete(storyId: string, userId: string) {
    const story = await this.storyModel.findById(storyId);
    if (!story) throw new NotFoundException('Story not found');
    if (story.author.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own stories');
    }
    
    // Use findByIdAndDelete to avoid TS errors on document methods
    await this.storyModel.findByIdAndDelete(storyId);
    return { deleted: true };
  }
}