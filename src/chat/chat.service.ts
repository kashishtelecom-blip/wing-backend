import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';
import { Message, MessageDocument } from './schemas/message.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async getOrCreateConversation(userId: string, otherUserId: string) {
    if (userId === otherUserId) throw new BadRequestException('Cannot chat with yourself');
    const other = await this.userModel.findById(otherUserId).select('-password');
    if (!other) throw new NotFoundException('User not found');

    const uId = new Types.ObjectId(userId);
    const oId = new Types.ObjectId(otherUserId);

    let conv = await this.conversationModel.findOne({
      participants: { $all: [uId, oId], $size: 2 },
    });

    if (!conv) {
      conv = await this.conversationModel.create({
        participants: [uId, oId],
      });
    }

    return this.populateConversation(conv, userId);
  }

  async getMyConversations(userId: string) {
    const uId = new Types.ObjectId(userId);
    const convs = await this.conversationModel
      .find({ participants: uId })
      .sort({ lastMessageAt: -1 })
      .limit(50)
      .exec();

    const populated = await Promise.all(convs.map((c) => this.populateConversation(c, userId)));
    return populated.filter((c) => c.other !== null);
  }

  private async populateConversation(conv: ConversationDocument, currentUserId: string) {
    const populated = await conv.populate([
      { path: 'participants', select: 'username name avatarUrl isVerified' },
      {
        path: 'lastMessage',
        select: 'text sender createdAt read',
        populate: { path: 'sender', select: 'username' },
      },
    ]);

    const unreadCount = await this.messageModel.countDocuments({
      conversation: conv._id,
      sender: { $ne: new Types.ObjectId(currentUserId) },
      read: false,
    });

    const participants = (populated.participants as any[]).map((p) => ({
      _id: p._id?.toString() || '',
      username: p.username || 'unknown',
      name: p.name || '',
      avatarUrl: p.avatarUrl || '',
      isVerified: p.isVerified || false,
    }));

    const other = participants.find((p: any) => p._id !== currentUserId) || null;

    return {
      _id: conv._id.toString(),
      participants,
      other,
      lastMessage: populated.lastMessage,
      lastMessageAt: conv.lastMessageAt,
      unreadCount,
    };
  }

  async getMessages(conversationId: string, userId: string, page = 1, limit = 50) {
    const conv = await this.conversationModel.findById(conversationId);
    if (!conv) throw new NotFoundException('Conversation not found');
    if (!conv.participants.some((p) => p.toString() === userId)) {
      throw new ForbiddenException('Not a participant');
    }

    const skip = (page - 1) * limit;
    const messages = await this.messageModel
      .find({ conversation: conv._id, deletedAt: null })
      .populate('sender', 'username name avatarUrl isVerified')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return messages.reverse().map((m) => ({
      _id: m._id.toString(),
      conversation: m.conversation.toString(),
      sender: {
        _id: (m.sender as any)?._id?.toString() || '',
        username: (m.sender as any)?.username || 'unknown',
        name: (m.sender as any)?.name || '',
        avatarUrl: (m.sender as any)?.avatarUrl || '',
        isVerified: (m.sender as any)?.isVerified || false,
      },
       text: m.text,
      read: m.read,
      createdAt: (m as any).createdAt,
    }));
  }

  async sendMessage(conversationId: string, userId: string, text: string) {
    if (!text || !text.trim()) throw new BadRequestException('Message text required');
    const conv = await this.conversationModel.findById(conversationId);
    if (!conv) throw new NotFoundException('Conversation not found');
    if (!conv.participants.some((p) => p.toString() === userId)) {
      throw new ForbiddenException('Not a participant');
    }

    const msg = await this.messageModel.create({
      conversation: conv._id,
      sender: new Types.ObjectId(userId),
      text: text.trim().slice(0, 1000),
      read: false,
    });

    conv.lastMessage = msg._id as any;
    conv.lastMessageAt = new Date();
    await conv.save();

    const populated = await msg.populate('sender', 'username name avatarUrl isVerified');

    return {
      _id: populated._id.toString(),
      conversation: populated.conversation.toString(),
      sender: {
        _id: (populated.sender as any)?._id?.toString() || '',
        username: (populated.sender as any)?.username || 'unknown',
        name: (populated.sender as any)?.name || '',
        avatarUrl: (populated.sender as any)?.avatarUrl || '',
        isVerified: (populated.sender as any)?.isVerified || false,
      },
       text: populated.text,
      read: populated.read,
      createdAt: (populated as any).createdAt,
    };
  }

  async markRead(conversationId: string, userId: string) {
    const result = await this.messageModel.updateMany(
      {
        conversation: new Types.ObjectId(conversationId),
        sender: { $ne: new Types.ObjectId(userId) },
        read: false,
      },
      { read: true },
    );
    return { updated: result.modifiedCount };
  }

  async getUnreadTotal(userId: string) {
    const convs = await this.conversationModel.find({
      participants: new Types.ObjectId(userId),
    }).select('_id');
    const convIds = convs.map((c) => c._id);
    if (convIds.length === 0) return { count: 0 };

    const count = await this.messageModel.countDocuments({
      conversation: { $in: convIds },
      sender: { $ne: new Types.ObjectId(userId) },
      read: false,
    });
    return { count };
  }
}