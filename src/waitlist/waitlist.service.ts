import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Waitlist, WaitlistDocument } from './schemas/waitlist.schema';
import { JoinWaitlistDto } from './dto/join-waitlist.dto';

@Injectable()
export class WaitlistService {
  constructor(
    @InjectModel(Waitlist.name) private waitlistModel: Model<WaitlistDocument>,
  ) {}

  private isValidId(id: string | null | undefined): boolean {
    return !!id && Types.ObjectId.isValid(id);
  }

  async join(userId: string | null | undefined, dto: JoinWaitlistDto) {
    const source = dto.source || 'web';
    const email = dto.email.trim().toLowerCase();

    const or: any[] = [{ email, source }];
    if (this.isValidId(userId)) {
      or.push({ user: new Types.ObjectId(userId as string), source });
    }

    const existing = await this.waitlistModel.findOne({ $or: or });
    if (existing) {
      return {
        joined: true,
        alreadyOn: true,
        message: 'You are already on the waitlist',
      };
    }

    const doc: any = {
      email,
      source,
      status: 'pending',
    };
    if (this.isValidId(userId)) {
      doc.user = new Types.ObjectId(userId as string);
    }

    await this.waitlistModel.create(doc);

    return {
      joined: true,
      alreadyOn: false,
      message: 'Added to waitlist',
    };
  }

  async check(userId: string, source?: string) {
    if (!this.isValidId(userId)) {
      return { onWaitlist: false };
    }
    const filter: any = { user: new Types.ObjectId(userId) };
    if (source) filter.source = source;
    const entry = await this.waitlistModel.findOne(filter);
    return { onWaitlist: !!entry };
  }

  async count(source?: string) {
    const filter: any = {};
    if (source) filter.source = source;
    const total = await this.waitlistModel.countDocuments(filter);
    return { total };
  }
}