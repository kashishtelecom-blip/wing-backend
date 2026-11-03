import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AdImpressionDocument = AdImpression & Document;

@Schema({ timestamps: true })
export class AdImpression {
  @Prop({ type: Types.ObjectId, ref: 'Wing', required: true })
  wing: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  creator: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  viewer: Types.ObjectId;
}

export const AdImpressionSchema = SchemaFactory.createForClass(AdImpression);

// CRITICAL: Create a compound index so a viewer can only generate 1 impression per post
AdImpressionSchema.index({ wing: 1, viewer: 1 }, { unique: true });