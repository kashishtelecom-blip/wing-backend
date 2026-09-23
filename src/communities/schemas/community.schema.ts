import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CommunityDocument = HydratedDocument<Community>;

@Schema({ timestamps: true })
export class Community {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ default: '' })
  emoji: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  creator: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  members: Types.ObjectId[];

  @Prop({ default: true })
  isPublic: boolean;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: 0 })
  membersCount: number;

  @Prop({ default: 0 })
  postsCount: number;
}

export const CommunitySchema = SchemaFactory.createForClass(Community);
CommunitySchema.index({ name: 'text', description: 'text', tags: 'text' });