import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AdImpression, AdImpressionDocument } from './schemas/ad-impression.schema';
import { CreatorEarning, CreatorEarningDocument } from './schemas/creator-earning.schema';
import { Wing, WingDocument } from '../wings/schemas/wing.schema';

@Injectable()
export class EarningsService {
  constructor(
    @InjectModel(AdImpression.name) private impressionModel: Model<AdImpressionDocument>,
    @InjectModel(CreatorEarning.name) private earningModel: Model<CreatorEarningDocument>,
    @InjectModel(Wing.name) private wingModel: Model<WingDocument>,
  ) {}

  // 1. Track a view
  async trackImpression(wingId: string, viewerId: string) {
    const wing = await this.wingModel.findById(wingId);
    if (!wing) return { success: false };

    try {
      // Create impression (will fail silently if viewer already saw it)
      await this.impressionModel.create({
        wing: new Types.ObjectId(wingId),
        creator: wing.author,
        viewer: new Types.ObjectId(viewerId),
      });

      // Increment the creator's lifetime view count
      await this.earningModel.findOneAndUpdate(
        { user: wing.author },
        { $inc: { totalQualifiedViews: 1 } },
        { upsert: true },
      );

      return { success: true };
    } catch (error: any) {
      // Error 11000 means it's a duplicate view, which is fine
      if (error.code === 11000) return { success: true, duplicate: true };
      return { success: false };
    }
  }

  // 2. Get creator dashboard stats
  async getMyEarnings(userId: string) {
    let earnings = await this.earningModel.findOne({ user: new Types.ObjectId(userId) });
    
    if (!earnings) {
      // Create a wallet if it doesn't exist
      earnings = await this.earningModel.create({ user: new Types.ObjectId(userId) });
    }
    return earnings;
  }

  // 3. MONTHLY PAYOUT CALCULATION (This will be run by a Cron Job)
  async calculateMonthlyPayouts(totalAdRevenue: number) {
    const CREATOR_SHARE_PERCENTAGE = 0.55; // 55% goes to creators
    const pool = totalAdRevenue * CREATOR_SHARE_PERCENTAGE;

    // Get views from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalViews = await this.impressionModel.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    if (totalViews === 0) return { message: 'No views to calculate' };

    // Group views by creator
    const creatorViews = await this.impressionModel.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$creator', count: { $sum: 1 } } },
    ]);

    // Distribute the pool
    for (const creator of creatorViews) {
      const viewShare = creator.count / totalViews;
      const earningsAmount = pool * viewShare;

      await this.earningModel.findOneAndUpdate(
        { user: creator._id },
        { 
          $inc: { 
            pendingBalance: earningsAmount,
            lifetimeEarnings: earningsAmount,
            totalQualifiedViews: creator.count,
          } 
        },
        { upsert: true },
      );
    }

    return { message: `Distributed ₹${pool} across ${creatorViews.length} creators.` };
  }
}