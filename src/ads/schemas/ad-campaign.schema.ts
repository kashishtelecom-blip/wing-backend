import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AdCampaignDocument = HydratedDocument<AdCampaign>;

export enum AdStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

@Schema({ timestamps: true })
export class AdCampaign {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  objective: string;

  @Prop({ type: Types.ObjectId, ref: 'Wing' })
  wing?: Types.ObjectId;

  @Prop({ required: true, default: 1 })
  dailyBudget: number;

  @Prop({ type: Date })
  startDate?: Date;

  @Prop({ type: Date })
  endDate?: Date;

  @Prop({ type: String, enum: AdStatus, default: AdStatus.DRAFT })
  status: AdStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId;

  @Prop({ default: 0 })
  impressions: number;

  @Prop({ default: 0 })
  clicks: number;

  @Prop({ default: 0 })
  spent: number;
}

export const AdCampaignSchema = SchemaFactory.createForClass(AdCampaign);