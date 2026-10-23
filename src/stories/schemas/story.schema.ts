import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type StoryDocument = HydratedDocument<Story>;

@Schema({ timestamps: true })
export class Story {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author: Types.ObjectId;

  @Prop({ required: true })
  mediaUrl: string;

  @Prop({ required: true, enum: ['image', 'video'] })
  mediaType: 'image' | 'video';

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  views: Types.ObjectId[];

  @Prop({ type: Date, required: true, index: { expires: '24h' } })
  expiresAt: Date;
}

export const StorySchema = SchemaFactory.createForClass(Story);