import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type WingDocument = HydratedDocument<Wing>;

@Schema({ timestamps: true })
export class Wing {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author: Types.ObjectId;

  @Prop({ default: 0 })
  views: number;

  @Prop({ default: false })
  isPublished: boolean;

 @Prop({ default: true })
  commentsEnabled: boolean;

 @Prop({ default: 'all-rights-reserved' })
  copyright: string;

  @Prop()
  imageUrl?: string;

  @Prop()
  videoUrl?: string;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;

  @Prop({ default: 0 })
  likesCount: number;

  @Prop({ default: 0 })
  commentsCount: number;

  @Prop({ default: 0 })
  repostsCount: number;

  @Prop({ default: 0 })
  bookmarksCount: number;

  @Prop({ type: Date, default: null })
  editedAt?: Date | null;

  @Prop({ default: 0 })
  editCount: number;

  @Prop({ default: false })
  isDraft: boolean;

  @Prop({
    type: {
      question: String,
      options: [{ text: String, votes: { type: Number, default: 0 } }],
      endsAt: Date,
      totalVotes: { type: Number, default: 0 },
    },
    default: null,
  })
  poll?: {
    question: string;
    options: { text: string; votes: number }[];
    endsAt: Date;
    totalVotes: number;
  } | null;

  @Prop({ type: [String], default: [] })
  hashtags: string[];

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  mentions: Types.ObjectId[];
}

export const WingSchema = SchemaFactory.createForClass(Wing);

WingSchema.index({ hashtags: 1, createdAt: -1 });
WingSchema.index({ createdAt: -1 });
WingSchema.index({ author: 1, isDraft: 1, createdAt: -1 });