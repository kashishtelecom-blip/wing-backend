import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as webpush from 'web-push';
import { PushSubscription } from './schemas/push-subscription.schema';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(
    @InjectModel(PushSubscription.name)
    private pushModel: Model<PushSubscription>,
  ) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:hello@wingapp.com',
      process.env.VAPID_PUBLIC_KEY || '',
      process.env.VAPID_PRIVATE_KEY || '',
    );
  }

  async subscribe(userId: string, sub: any) {
    try {
      return await this.pushModel.findOneAndUpdate(
        { endpoint: sub.endpoint },
        { user: userId, endpoint: sub.endpoint, keys: sub.keys },
        { upsert: true, returnDocument: 'after' },
      );
    } catch (err: any) {
      if (err.code === 11000) {
        return this.pushModel.findOneAndUpdate(
          { endpoint: sub.endpoint },
          { user: userId, keys: sub.keys },
          { returnDocument: 'after' },
        );
      }
      throw err;
    }
  }

  async sendPush(
    userId: string,
    payload: { title: string; body: string; url?: string },
  ) {
    const subs = await this.pushModel.find({ user: userId });

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          JSON.stringify(payload),
        );
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await this.pushModel.deleteOne({ _id: sub._id });
        } else {
          this.logger.error(`Push failed: ${err.message}`);
        }
      }
    }
  }
}