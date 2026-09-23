import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RepostDocument = HydratedDocument<Repost>;

@Schema({ timestamps: true })
export class Repost {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Wing', required: true })
  wing: Types.ObjectId;

  // If present, it's a quote-wing (repost with comment)
  @Prop()
  quoteText?: string;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}

export const RepostSchema = SchemaFactory.createForClass(Repost);

RepostSchema.index({ user: 1, wing: 1 }, { unique: true });
RepostSchema.index({ createdAt: -1 });