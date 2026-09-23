import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum SubscriptionTier {
  FREE = 'free',
  VERIFIED = 'verified',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, unique: true, lowercase: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  name?: string;

  @Prop({ default: '' })
  bio: string;

  @Prop({ default: '' })
  avatarUrl: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ type: Date, default: null })
  verifiedUntil: Date | null;

  @Prop({ type: String, enum: SubscriptionTier, default: SubscriptionTier.FREE })
  subscriptionTier: SubscriptionTier;

  @Prop({ type: String, enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop({ type: Types.ObjectId, ref: 'Wing', default: null })
  pinnedWing?: Types.ObjectId | null;

  // ============ SETTINGS ============
  @Prop({
    type: {
      privacy: {
        privateAccount: { type: Boolean, default: false },
        showActivity: { type: Boolean, default: true },
        allowDMsFrom: { type: String, enum: ['everyone', 'followers', 'nobody'], default: 'everyone' },
      },
      notifications: {
        inAppNotifications: { type: Boolean, default: true },
        emailOnMention: { type: Boolean, default: true },
        emailOnFollow: { type: Boolean, default: false },
        emailOnLike: { type: Boolean, default: false },
      },
      content: {
        showSensitiveContent: { type: Boolean, default: false },
        autoplayVideos: { type: Boolean, default: true },
      },
    },
    default: {
      privacy: { privateAccount: false, showActivity: true, allowDMsFrom: 'everyone' },
      notifications: { inAppNotifications: true, emailOnMention: true, emailOnFollow: false, emailOnLike: false },
      content: { showSensitiveContent: false, autoplayVideos: true },
    },
  })
  settings: {
    privacy: {
      privateAccount: boolean;
      showActivity: boolean;
      allowDMsFrom: 'everyone' | 'followers' | 'nobody';
    };
    notifications: {
      inAppNotifications: boolean;
      emailOnMention: boolean;
      emailOnFollow: boolean;
      emailOnLike: boolean;
    };
    content: {
      showSensitiveContent: boolean;
      autoplayVideos: boolean;
    };
  };

  // ============ BLOCKING ============
  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  blockedUsers: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  mutedUsers: Types.ObjectId[];

  // ============ ACCOUNT STATE ============
  @Prop({ type: Date, default: null })
  deactivatedAt: Date | null;

  @Prop({ default: true })
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);