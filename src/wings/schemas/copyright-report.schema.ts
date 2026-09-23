import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CopyrightReportDocument = HydratedDocument<CopyrightReport>;

export enum ReportStatus {
  PENDING = 'pending',
  REVIEWING = 'reviewing',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

@Schema({ timestamps: true })
export class CopyrightReport {
  @Prop({ type: Types.ObjectId, ref: 'Wing', required: true })
  wing: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reporter: Types.ObjectId;

  @Prop({ required: true })
  reporterEmail: string;

  @Prop({ required: true })
  reason: string;

  @Prop({ required: true })
  originalWorkUrl: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: String, enum: ReportStatus, default: ReportStatus.PENDING })
  status: ReportStatus;
}

export const CopyrightReportSchema = SchemaFactory.createForClass(CopyrightReport);