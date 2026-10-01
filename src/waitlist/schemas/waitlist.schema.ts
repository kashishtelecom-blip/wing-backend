import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type WaitlistDocument = HydratedDocument<Waitlist>;

@Schema({ timestamps: true })
export class Waitlist {
  @Prop({ type: Types.ObjectId, ref: 'User', required: false, default: null })
  user?: Types.ObjectId;

  @Prop({ required: true, index: true })
  email: string;

  @Prop({ required: true, default: 'web' })
  source: string;

  @Prop({ default: 'pending' })
  status: string;
}

export const WaitlistSchema = SchemaFactory.createForClass(Waitlist);

// Unique per email + source (works for both anonymous and logged-in)
WaitlistSchema.index({ email: 1, source: 1 }, { unique: true });

// Sparse index for logged-in users (only unique when user is present)
WaitlistSchema.index({ user: 1, source: 1 }, { unique: true, sparse: true });