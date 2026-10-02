import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type WaitlistDocument = HydratedDocument<Waitlist>;

@Schema({ timestamps: true })
export class Waitlist {
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  user?: Types.ObjectId;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true, default: 'web' })
  source: string;

  @Prop({ default: 'pending' })
  status: string;
}

export const WaitlistSchema = SchemaFactory.createForClass(Waitlist);