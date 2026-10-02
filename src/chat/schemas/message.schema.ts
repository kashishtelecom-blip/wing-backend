
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true })
  conversation: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender: Types.ObjectId;

  @Prop({ default: '' })
  text: string;

  @Prop({ type: String, default: null })
  mediaUrl: string | null;

  @Prop({ type: String, enum: ['image', 'video', null], default: null })
  mediaType: 'image' | 'video' | null;

  @Prop({ type: Types.ObjectId, ref: 'Message', default: null })
  replyTo?: Types.ObjectId | null;

  @Prop({ default: false })
  read: boolean;

  @Prop({ type: Date, default: null })
  deliveredAt: Date | null;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({ conversation: 1, createdAt: -1 });