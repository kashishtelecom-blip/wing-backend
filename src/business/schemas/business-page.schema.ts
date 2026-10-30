import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BusinessPageDocument = HydratedDocument<BusinessPage>;

@Schema({ timestamps: true })
export class BusinessPage {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: '' })
  avatarUrl: string;

  @Prop({ default: '' })
  coverUrl: string;

  @Prop({ default: 'Brand' })
  category: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  followers: Types.ObjectId[];
}

export const BusinessPageSchema = SchemaFactory.createForClass(BusinessPage);
BusinessPageSchema.index({ slug: 1 });