import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AdImpressionDocument = HydratedDocument<AdImpression>;

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
// Prevent the same viewer from spamming views on the same post
AdImpressionSchema.index({ wing: 1, viewer: 1 }, { unique: true });