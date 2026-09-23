import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CommunityMessageDocument = HydratedDocument<CommunityMessage>;

@Schema({ timestamps: true })
export class CommunityMessage {
  @Prop({ type: Types.ObjectId, ref: 'Community', required: true })
  community: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender: Types.ObjectId;

  @Prop({ required: true })
  text: string;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const CommunityMessageSchema = SchemaFactory.createForClass(CommunityMessage);
CommunityMessageSchema.index({ community: 1, createdAt: -1 });