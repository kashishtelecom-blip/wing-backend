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
  async sendMessage(communityId: string, userId: string, text: string) {
    if (!text || !text.trim()) throw new BadRequestException('Message text required');
    const community = await this.communityModel.findById(communityId);
    if (!community) throw new NotFoundException('Community not found');

    const isMember = community.members.some((m) => m.toString() === userId);
    if (!isMember) throw new ForbiddenException('You must join the community to chat');

    const msg = await this.messageModel.create({
      community: new Types.ObjectId(communityId),
      sender: new Types.ObjectId(userId),
      text: text.trim().slice(0, 1000),
    });

    return msg.populate('sender', 'username name avatarUrl isVerified');
  }

  async getMessages(communityId: string, userId: string, limit = 50) {
    const community = await this.communityModel.findById(communityId);
    if (!community) throw new NotFoundException('Community not found');

    const isMember = community.members.some((m) => m.toString() === userId);
    if (!isMember) {
      throw new ForbiddenException('You must join the community to view messages');
    }

    const messages = await this.messageModel
      .find({ community: new Types.ObjectId(communityId), deletedAt: null })
      .populate('sender', 'username name avatarUrl isVerified')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();

    return messages.reverse();
  }
}