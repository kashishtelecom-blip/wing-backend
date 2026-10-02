import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Community, CommunityDocument } from './schemas/community.schema';
import { CommunityMessage, CommunityMessageDocument } from './schemas/community-message.schema';
import { CreateCommunityDto } from './dto/create-community.dto';

@Injectable()
export class CommunitiesService {
  constructor(
    @InjectModel(Community.name) private communityModel: Model<CommunityDocument>,
    @InjectModel(CommunityMessage.name)
    private messageModel: Model<CommunityMessageDocument>,
  ) {}

  async create(userId: string, dto: CreateCommunityDto) {
    const existing = await this.communityModel.findOne({
      name: { $regex: '^' + dto.name + '$', $options: 'i' },
    });
    if (existing) throw new ConflictException('A community with this name already exists');

    const creatorId = new Types.ObjectId(userId);
    const community = await this.communityModel.create({
      name: dto.name.trim(),
      description: dto.description.trim(),
      emoji: dto.emoji || '👥',
      isPublic: dto.isPublic !== false,
      tags: dto.tags || [],
      creator: creatorId,
      members: [creatorId],
      membersCount: 1,
    });
    return community.populate('creator', 'name username avatarUrl isVerified');
  }

  async findAll(search?: string, limit = 30) {
    const filter: any = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }
    return this.communityModel
      .find(filter)
      .populate('creator', 'name username avatarUrl isVerified')
      .sort({ membersCount: -1, createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async findOne(id: string) {
    const community = await this.communityModel
      .findById(id)
      .populate('creator', 'name username avatarUrl isVerified')
      .populate('members', 'name username avatarUrl isVerified')
      .exec();
    if (!community) throw new NotFoundException('Community not found');
    return community;
  }

  async join(userId: string, communityId: string) {
    const community = await this.communityModel.findById(communityId);
    if (!community) throw new NotFoundException('Community not found');

    const uid = new Types.ObjectId(userId);
    if (community.members.some((m) => m.toString() === userId)) {
      return { joined: true, membersCount: community.membersCount };
    }

    community.members.push(uid);
    community.membersCount += 1;
    await community.save();
    return { joined: true, membersCount: community.membersCount };
  }

  async leave(userId: string, communityId: string) {
    const community = await this.communityModel.findById(communityId);
    if (!community) throw new NotFoundException('Community not found');

    if (community.creator.toString() === userId) {
      throw new ForbiddenException('The creator cannot leave the community');
    }

    const before = community.members.length;
    community.members = community.members.filter((m) => m.toString() !== userId);
    if (community.members.length < before) {
      community.membersCount = community.members.length;
      await community.save();
    }
    return { joined: false, membersCount: community.membersCount };
  }

  async getMyCommunities(userId: string) {
    const uid = new Types.ObjectId(userId);
    return this.communityModel
      .find({ members: uid })
      .populate('creator', 'name username avatarUrl isVerified')
      .sort({ createdAt: -1 })
      .exec();
  }

  async addMembers(creatorId: string, communityId: string, userIds: string[]) {
    const community = await this.communityModel.findById(communityId);
    if (!community) throw new NotFoundException('Community not found');
    if (community.creator.toString() !== creatorId) {
      throw new ForbiddenException('Only the creator can add members');
    }

    const existingIds = new Set(community.members.map((m) => m.toString()));
    let added = 0;
    for (const uid of userIds) {
      if (!existingIds.has(uid)) {
        community.members.push(new Types.ObjectId(uid));
        added += 1;
      }
    }
    community.membersCount = community.members.length;
    await community.save();

    return { added, membersCount: community.membersCount };
  }

  async removeMember(creatorId: string, communityId: string, userId: string) {
    const community = await this.communityModel.findById(communityId);
    if (!community) throw new NotFoundException('Community not found');
    if (community.creator.toString() !== creatorId) {
      throw new ForbiddenException('Only the creator can remove members');
    }
    if (community.creator.toString() === userId) {
      throw new ForbiddenException('Creator cannot be removed');
    }

    community.members = community.members.filter((m) => m.toString() !== userId);
    community.membersCount = community.members.length;
    await community.save();

    return { membersCount: community.membersCount };
  }

  async delete(userId: string, communityId: string) {
    const community = await this.communityModel.findById(communityId);
    if (!community) throw new NotFoundException('Community not found');
    if (community.creator.toString() !== userId) {
      throw new ForbiddenException('Only the creator can delete this community');
    }
    await community.deleteOne();
    return { deleted: true };
  }

    // ============ GROUP CHAT ============
  async sendMessage(
    communityId: string,
    userId: string,
    text: string,
    mediaUrl?: string,
    mediaType?: 'image' | 'video',
    replyTo?: string,
  ) {
    const community = await this.communityModel.findById(communityId);
    if (!community) throw new NotFoundException('Community not found');

    const isMember = community.members.some((m) => m.toString() === userId);
    if (!isMember) throw new ForbiddenException('You must join the community to chat');

    const msg = await this.messageModel.create({
      community: new Types.ObjectId(communityId),
      sender: new Types.ObjectId(userId),
      text: (text || '').trim().slice(0, 2000),
      mediaUrl: mediaUrl || null,
      mediaType: mediaType || null,
      replyTo: replyTo && Types.ObjectId.isValid(replyTo) ? new Types.ObjectId(replyTo) : null,
    });

    return this.messageModel
      .findById(msg._id)
      .populate('sender', 'username name avatarUrl isVerified')
      .populate({
        path: 'replyTo',
        select: 'text mediaUrl mediaType sender deletedAt',
        populate: { path: 'sender', select: 'username name' },
      })
      .exec();
  }

  async getMessages(communityId: string, userId: string, limit = 50) {
    const community = await this.communityModel.findById(communityId);
    if (!community) throw new NotFoundException('Community not found');

    const isMember = community.members.some((m) => m.toString() === userId);
    if (!isMember) {
      throw new ForbiddenException('You must join the community to view messages');
    }

    // Mark other people's messages as delivered
    await this.messageModel.updateMany(
      {
        community: new Types.ObjectId(communityId),
        sender: { $ne: new Types.ObjectId(userId) },
        deliveredAt: null,
      },
      { $set: { deliveredAt: new Date() } },
    );

    const messages = await this.messageModel
      .find({ community: new Types.ObjectId(communityId), deletedAt: null })
      .populate('sender', 'username name avatarUrl isVerified')
      .populate({
        path: 'replyTo',
        select: 'text mediaUrl mediaType sender deletedAt',
        populate: { path: 'sender', select: 'username name' },
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();

    return messages.reverse();
  }

  async deleteMessage(communityId: string, userId: string, messageId: string) {
    if (!Types.ObjectId.isValid(messageId)) {
      throw new BadRequestException('Invalid message id');
    }
    const msg = await this.messageModel.findById(messageId);
    if (!msg) throw new NotFoundException('Message not found');
    if (msg.sender.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }
    msg.text = '';
    msg.mediaUrl = null;
    msg.mediaType = null;
    msg.deletedAt = new Date();
    await msg.save();
    return { deleted: true };
  }
}