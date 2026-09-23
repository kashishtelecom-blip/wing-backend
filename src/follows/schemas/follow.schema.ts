import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FollowDocument = HydratedDocument<Follow>;

@Schema({ timestamps: true })
export class Follow {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  follower: Types.ObjectId;   // who is following

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  following: Types.ObjectId;  // who is being followed
}

export const FollowSchema = SchemaFactory.createForClass(Follow);

// Prevent duplicate follows
FollowSchema.index({ follower: 1, following: 1 }, { unique: true });