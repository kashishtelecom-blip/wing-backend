import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Waitlist, WaitlistDocument } from './schemas/waitlist.schema';
import { JoinWaitlistDto } from './dto/join-waitlist.dto';

@Injectable()
export class WaitlistService {
  constructor(
    @InjectModel(Waitlist.name) private waitlistModel: Model<WaitlistDocument>,
  ) {}

  async join(userId: string, dto: JoinWaitlistDto) {
    const source = dto.source || 'business';
    const existing = await this.waitlistModel.findOne({
      user: new Types.ObjectId(userId),
      source,
    });
    if (existing) {
      return { joined: true, alreadyOn: true, message: 'You are already on the waitlist' };
    }

    await this.waitlistModel.create({
      user: new Types.ObjectId(userId),
      email: dto.email,
      source,
      status: 'pending',
    });

    return { joined: true, alreadyOn: false, message: 'Added to waitlist' };
  }

  async check(userId: string, source = 'business') {
    const entry = await this.waitlistModel.findOne({
      user: new Types.ObjectId(userId),
      source,
    });
    return { onWaitlist: !!entry };
  }

  async count(source = 'business') {
    const total = await this.waitlistModel.countDocuments({ source });
    return { total, source };
  }
}