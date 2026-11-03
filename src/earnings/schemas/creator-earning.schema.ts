import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CreatorEarningDocument = CreatorEarning & Document;

@Schema({ timestamps: true })
export class CreatorEarning {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  user: Types.ObjectId;

  @Prop({ default: 0 })
  pendingBalance: number; // Money calculated by the cron job, ready to withdraw

  @Prop({ default: 0 })
  lifetimeEarnings: number; // Total money ever earned

  @Prop({ default: 0 })
  totalQualifiedViews: number; // Total valid views
}

export const CreatorEarningSchema = SchemaFactory.createForClass(CreatorEarning);