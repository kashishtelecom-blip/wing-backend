import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SpaceDocument = Space & Document;

@Schema({ timestamps: true })
export class Space {
  @Prop({ required: true })
  title: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  host: Types.ObjectId;

  @Prop({ default: true })
  isLive: boolean;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  listeners: Types.ObjectId[];
}

export const SpaceSchema = SchemaFactory.createForClass(Space);