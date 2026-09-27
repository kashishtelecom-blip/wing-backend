import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { List, ListDocument } from './schemas/list.schema';
import { CreateListDto, AddListMembersDto } from './dto/create-list.dto';
import { Wing, WingDocument } from '../wings/schemas/wing.schema';

@Injectable()
export class ListsService {
  constructor(
    @InjectModel(List.name) private listModel: Model<ListDocument>,
    @InjectModel(Wing.name) private wingModel: Model<WingDocument>,
  ) {}

  async create(userId: string, dto: CreateListDto) {
    const existing = await this.listModel.findOne({
      owner: new Types.ObjectId(userId),
      name: { $regex: '^' + dto.name + '$', $options: 'i' },
    });
    if (existing) throw new ConflictException('You already have a list with this name');

    const list = await this.listModel.create({
      name: dto.name.trim(),
      description: dto.description?.trim() || '',
      emoji: dto.emoji || '📋',
      isPublic: dto.isPublic !== false,
      owner: new Types.ObjectId(userId),
      members: [],
      membersCount: 0,
    });
    return list;
  }

  async findMine(userId: string) {
    return this.listModel
      .find({ owner: new Types.ObjectId(userId) })
      .populate('members', 'name username avatarUrl isVerified')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(listId: string, userId: string) {
    const list = await this.listModel
      .findById(listId)
      .populate('owner', 'name username avatarUrl isVerified')
      .populate('members', 'name username avatarUrl isVerified')
      .exec();
    if (!list) throw new NotFoundException('List not found');
    if (!list.isPublic && list.owner._id.toString() !== userId) {
      throw new ForbiddenException('This list is private');
    }
    return list;
  }

  async addMembers(userId: string, listId: string, dto: AddListMembersDto) {
    const list = await this.listModel.findById(listId);
    if (!list) throw new NotFoundException('List not found');
    if (list.owner.toString() !== userId) {
      throw new ForbiddenException('Only the owner can add members');
    }

    const existingIds = new Set(list.members.map((m) => m.toString()));
    const newIds = (dto.userIds || [])
      .filter((id) => !existingIds.has(id))
      .map((id) => new Types.ObjectId(id));

    if (newIds.length === 0) {
      return { added: 0, membersCount: list.membersCount };
    }

    list.members.push(...newIds);
    list.membersCount = list.members.length;
    await list.save();

    return { added: newIds.length, membersCount: list.membersCount };
  }

  async removeMember(userId: string, listId: string, memberId: string) {
    const list = await this.listModel.findById(listId);
    if (!list) throw new NotFoundException('List not found');
    if (list.owner.toString() !== userId) {
      throw new ForbiddenException('Only the owner can remove members');
    }
    list.members = list.members.filter((m) => m.toString() !== memberId);
    list.membersCount = list.members.length;
    await list.save();
    return { membersCount: list.membersCount };
  }

  async removeList(userId: string, listId: string) {
    const list = await this.listModel.findById(listId);
    if (!list) throw new NotFoundException('List not found');
    if (list.owner.toString() !== userId) {
      throw new ForbiddenException('Only the owner can delete this list');
    }
    await list.deleteOne();
    return { deleted: true };
  }

  async getTimeline(listId: string, userId: string, page = 1, limit = 20) {
    const list = await this.listModel.findById(listId).exec();
    if (!list) throw new NotFoundException('List not found');
    if (!list.isPublic && list.owner.toString() !== userId) {
      throw new ForbiddenException('This list is private');
    }

    const skip = (page - 1) * limit;
    const filter = {
      deletedAt: null,
      isPublished: true,
      isDraft: { $ne: true },
      author: { $in: list.members },
    };

    const [data, total] = await Promise.all([
      this.wingModel
        .find(filter)
        .populate('author', 'name username email avatarUrl isVerified')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.wingModel.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  }
}