import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Conversation, ConversationDocument,
} from './schemas/conversation.schema';
import { Message, MessageDocument } from './schemas/message.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name)
    private messageModel: Model<MessageDocument>,
  ) {}

  // ============================================
  // LIST CONVERSATIONS
  // ============================================
  async getMyConversations(userId: string) {
    const uid = new Types.ObjectId(userId);

    const conversations = await this.conversationModel
      .find({ participants: uid })
      .populate('participants', 'username name avatarUrl isVerified')
      .sort({ lastMessageAt: -1 })
      .exec();

    // Map each to include `other` (the participant that isn't me) and unreadCount
    const results = await Promise.all(
      conversations.map(async (conv: any) => {
        const other = (conv.participants || []).find(
          (p: any) => p._id.toString() !== userId,
        );

        const unreadCount = await this.messageModel.countDocuments({
          conversation: conv._id,
          sender: { $ne: uid },
          read: false,
          deletedAt: null,
        });

        const obj = conv.toObject();
        return {
          _id: obj._id,
          participants: obj.participants,
          other: other
            ? {
                _id: other._id,
                username: other.username,
                name: other.name,
                avatarUrl: other.avatarUrl,
                isVerified: other.isVerified,
              }
            : null,
          lastMessage: obj.lastMessage || null,
          lastMessageAt: obj.lastMessageAt,
          unreadCount,
        };
      }),
    );

    return results.filter((c) => c.other);
  }

  // ============================================
  // GET OR CREATE CONVERSATION
  // ============================================
  async getOrCreateConversation(userId: string, otherId: string) {
    if (!Types.ObjectId.isValid(otherId)) {
      throw new BadRequestException('Invalid userId');
    }
    if (userId === otherId) {
      throw new BadRequestException('Cannot message yourself');
    }

    const uid = new Types.ObjectId(userId);
    const oid = new Types.ObjectId(otherId);

    let conv = await this.conversationModel
      .findOne({ participants: { $all: [uid, oid] } })
      .populate('participants', 'username name avatarUrl isVerified')
      .exec();

    if (!conv) {
      conv = await this.conversationModel.create({
        participants: [uid, oid],
        lastMessageAt: new Date(),
      });
      conv = await conv.populate(
        'participants',
        'username name avatarUrl isVerified',
      );
    }

    const obj: any = conv.toObject();
    const other = (obj.participants || []).find(
      (p: any) => p._id.toString() !== userId,
    );

    return {
      _id: obj._id,
      participants: obj.participants,
      other: other
        ? {
            _id: other._id,
            username: other.username,
            name: other.name,
            avatarUrl: other.avatarUrl,
            isVerified: other.isVerified,
          }
        : null,
      lastMessage: obj.lastMessage || null,
      lastMessageAt: obj.lastMessageAt,
      unreadCount: 0,
    };
  }

  // ============================================
  // GET MESSAGES
  // ============================================
  async getMessages(
    conversationId: string,
    userId: string,
    page = 1,
    limit = 50,
  ) {
    if (!Types.ObjectId.isValid(conversationId)) return [];

    const conv = await this.conversationModel.findById(conversationId);
    if (!conv) throw new NotFoundException('Conversation not found');

    const isParticipant = (conv.participants || []).some(
      (p: any) => p.toString() === userId,
    );
    if (!isParticipant) throw new ForbiddenException('Not a participant');

    const skip = (page - 1) * limit;
    const messages = await this.messageModel
      .find({ conversation: new Types.ObjectId(conversationId), deletedAt: null })
            .populate('sender', 'username name avatarUrl isVerified')
      .populate({
        path: 'replyTo',
        select: 'text mediaUrl mediaType sender deletedAt',
        populate: { path: 'sender', select: 'username name' },
      })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return messages;
  }

  // ============================================
  // SEND MESSAGE (with media support)
  // ============================================
  async sendMessage(
    conversationId: string,
    userId: string,
    text: string,
    mediaUrl?: string,
    mediaType?: 'image' | 'video',
    replyTo?: string,
  ) {
    if (!Types.ObjectId.isValid(conversationId)) {
      throw new BadRequestException('Invalid conversation');
    }

    const conv = await this.conversationModel.findById(conversationId);
    if (!conv) throw new NotFoundException('Conversation not found');

    const isParticipant = (conv.participants || []).some(
      (p: any) => p.toString() === userId,
    );
    if (!isParticipant) throw new ForbiddenException('Not a participant');

    const message = await this.messageModel.create({
      conversation: new Types.ObjectId(conversationId),
      sender: new Types.ObjectId(userId),
      text: text || '',
      mediaUrl: mediaUrl || null,
      mediaType: mediaType || null,
      replyTo: replyTo && Types.ObjectId.isValid(replyTo) ? new Types.ObjectId(replyTo) : null,
    });

    (conv as any).lastMessage = {
      _id: message._id,
      text: text || '',
      sender: { _id: new Types.ObjectId(userId), username: '' },
      mediaUrl: mediaUrl || null,
      mediaType: mediaType || null,
      createdAt: (message as any).createdAt,
      read: false,
    };
    (conv as any).lastMessageAt = new Date();
    await conv.save();

    return this.messageModel
      .findById(message._id)
      .populate('sender', 'username name avatarUrl isVerified')
      .populate({
        path: 'replyTo',
        select: 'text mediaUrl mediaType sender',
        populate: { path: 'sender', select: 'username name' },
      })
      .exec();
  }

  async deleteMessage(conversationId: string, userId: string, messageId: string) {
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

  // ============================================
  // MARK CONVERSATION READ
  // ============================================
  async markRead(conversationId: string, userId: string) {
    const result = await this.messageModel.updateMany(
      {
        conversation: new Types.ObjectId(conversationId),
        sender: { $ne: new Types.ObjectId(userId) },
        read: false,
      },
      { $set: { read: true } },
    );
    return { updated: result.modifiedCount };
  }

  // ============================================
  // UNREAD TOTAL
  // ============================================
  async getUnreadTotal(userId: string) {
    const uid = new Types.ObjectId(userId);

    const convs = await this.conversationModel
      .find({ participants: uid })
      .select('_id')
      .exec();
    const convIds = convs.map((c) => c._id);

    const count = await this.messageModel.countDocuments({
      conversation: { $in: convIds },
      sender: { $ne: uid },
      read: false,
      deletedAt: null,
    });

    return { count };
  }
}