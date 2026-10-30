import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type StoryCommentDocument = HydratedDocument<StoryComment>;

@Schema({ timestamps: true })
export class StoryComment {
  @Prop({ type: Types.ObjectId, ref: 'Story', required: true })
  story: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author: Types.ObjectId;

  @Prop({ required: true })
  text: string;
}

export const StoryCommentSchema = SchemaFactory.createForClass(StoryComment);
StoryCommentSchema.index({ story: 1, createdAt: -1 });