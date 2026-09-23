import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
  NotificationType,
} from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  async create(
    recipient: string,
    sender: string,
    type: NotificationType,
    wing?: string,
  ) {
    // Don't notify yourself
    if (recipient === sender) return null;

    return this.notificationModel.create({
      recipient: new Types.ObjectId(recipient),
      sender: new Types.ObjectId(sender),
      type,
      wing: wing ? new Types.ObjectId(wing) : undefined,
    });
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