import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CommunityMessageDocument = HydratedDocument<CommunityMessage>;

@Schema({ timestamps: true })
export class CommunityMessage {
  @Prop({ type: Types.ObjectId, ref: 'Community', required: true })
  community: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender: Types.ObjectId;

  @Prop({ default: '' })
  text: string;

  @Prop({ type: String, default: null })
  mediaUrl: string | null;

  @Prop({ type: String, enum: ['image', 'video', null], default: null })
  mediaType: 'image' | 'video' | null;

  @Prop({ type: Types.ObjectId, ref: 'CommunityMessage', default: null })
  replyTo?: Types.ObjectId | null;

  @Prop({ default: false })
  read: boolean;

  @Prop({ type: Date, default: null })
  deliveredAt: Date | null;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const CommunityMessageSchema = SchemaFactory.createForClass(CommunityMessage);
CommunityMessageSchema.index({ community: 1, createdAt: -1 });