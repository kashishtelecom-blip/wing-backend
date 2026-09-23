import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type LikeDocument = HydratedDocument<Like>;

@Schema({ timestamps: true })
export class Like {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Wing', required: true })
  wing: Types.ObjectId;
}

export const LikeSchema = SchemaFactory.createForClass(Like);

// Prevent duplicate likes: one user can like a wing only once
LikeSchema.index({ user: 1, wing: 1 }, { unique: true });