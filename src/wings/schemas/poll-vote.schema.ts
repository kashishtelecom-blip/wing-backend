import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PollVoteDocument = HydratedDocument<PollVote>;

@Schema({ timestamps: true })
export class PollVote {
  @Prop({ type: Types.ObjectId, ref: 'Wing', required: true })
  wing: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true })
  optionIndex: number;
}

export const PollVoteSchema = SchemaFactory.createForClass(PollVote);
PollVoteSchema.index({ wing: 1, user: 1 }, { unique: true });
