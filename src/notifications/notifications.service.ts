import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
  NotificationType,
} from './schemas/notification.schema';
import { ChatGateway } from '../chat/chat.gateway';
import { PushService } from '../push/push.service'; // NEW

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private readonly gateway: ChatGateway,
    private readonly pushService: PushService, // NEW
  ) {}

  async create(
    recipient: string,
    sender: string,
    type: NotificationType,
    wing?: string,
  ) {
    if (recipient === sender) return null;

    const notification = await this.notificationModel.create({
      recipient: new Types.ObjectId(recipient),
      sender: new Types.ObjectId(sender),
      type,
      wing: wing ? new Types.ObjectId(wing) : undefined,
    });

    // ✅ Push real-time event to recipient's socket room
    try {
      const populated = await notification.populate([
        { path: 'sender', select: 'name username avatarUrl isVerified' },
        { path: 'wing', select: 'title' },
      ]);
      
      this.gateway.emitToUser(recipient, 'notification', populated.toObject());

           // 🔔 NEW: Send Web Push Notification
      let body = 'You have a new notification on Wing.';
      if (populated.sender) {
        const senderObj = populated.sender as any;
        const name = senderObj.name || senderObj.username;
        if (type === NotificationType.LIKE) body = `${name} liked your wing.`;
        else if (type === NotificationType.COMMENT) body = `${name} commented on your wing.`;
        else if (type === NotificationType.FOLLOW) body = `${name} followed you.`;
        else if (type === NotificationType.REPOST) body = `${name} reposted your wing.`;
        else if (type === NotificationType.MENTION) body = `${name} mentioned you in a wing.`;
      }

      // Fire and forget (don't block the main thread)
      this.pushService.sendPush(recipient, {
        title: 'Wing',
        body,
        url: '/notifications',
      }).catch(err => console.error('Push error:', err));

    } catch (err) {
      // Non-fatal — polling fallback still works
      console.warn('Failed to emit notification event:', (err as Error).message);
    }

    return notification;
  }

  async list(userId: string) {
    return this.notificationModel
      .find({ recipient: new Types.ObjectId(userId) })
      .populate('sender', 'name email')
      .populate('wing', 'title')
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }

  async markAsRead(id: string, userId: string) {
    return this.notificationModel.findOneAndUpdate(
      { _id: id, recipient: new Types.ObjectId(userId) },
      { read: true },
      { new: true },
    );
  }

  async markAllAsRead(userId: string) {
    await this.notificationModel.updateMany(
      { recipient: new Types.ObjectId(userId), read: false },
      { read: true },
    );
    return { success: true };
  }

  async unreadCount(userId: string) {
    const count = await this.notificationModel.countDocuments({
      recipient: new Types.ObjectId(userId),
      read: false,
    });
    return { count };
  }
}