import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CreatorEarningDocument = HydratedDocument<CreatorEarning>;

@Schema({ timestamps: true })
export class CreatorEarning {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  user: Types.ObjectId;

  @Prop({ default: 0 })
  totalQualifiedViews: number;

  @Prop({ default: 0 })
  pendingBalance: number; // Earned this month, not yet finalized

  @Prop({ default: 0 })
  availableBalance: number; // Ready to be withdrawn

  @Prop({ default: 0 })
  lifetimeEarnings: number;
}

export const CreatorEarningSchema = SchemaFactory.createForClass(CreatorEarning);