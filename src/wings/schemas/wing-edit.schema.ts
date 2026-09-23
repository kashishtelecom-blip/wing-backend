import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type WingEditDocument = HydratedDocument<WingEdit>;

@Schema({ timestamps: true })
export class WingEdit {
  @Prop({ type: Types.ObjectId, ref: 'Wing', required: true })
  wing: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  editor: Types.ObjectId;

  @Prop({ required: true })
  previousTitle: string;

  @Prop({ required: true })
  previousContent: string;

  @Prop({ default: 0 })
  version: number;
}

export const WingEditSchema = SchemaFactory.createForClass(WingEdit);
WingEditSchema.index({ wing: 1, version: -1 });
