import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CommentDocument = HydratedDocument<Comment>;

@Schema({ timestamps: true })
export class Comment {
  @Prop({ required: true })
  text: string;

  @Prop({ type: Types.ObjectId, ref: 'Wing', required: true })
  wing: Types.ObjectId; // reference to the wing

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author: Types.ObjectId; // reference to the user

  @Prop({ type: Date, default: null })
deletedAt?: Date | null;

}

export const CommentSchema = SchemaFactory.createForClass(Comment);