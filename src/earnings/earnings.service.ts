import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AdImpression, AdImpressionDocument } from './schemas/ad-impression.schema';
import { CreatorEarning, CreatorEarningDocument } from './schemas/creator-earning.schema';
import { Wing, WingDocument } from '../wings/schemas/wing.schema';
import { Cron, CronExpression } from '@nestjs/schedule'; 

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
      await this.impressionModel.create({
        wing: new Types.ObjectId(wingId),
        creator: wing.author,
        viewer: new Types.ObjectId(viewerId),
      });

      await this.earningModel.findOneAndUpdate(
        { user: wing.author },
        { $inc: { totalQualifiedViews: 1 } },
        { upsert: true },
      );

      return { success: true };
    } catch (error: any) {
      if (error.code === 11000) return { success: true, duplicate: true };
      return { success: false };
    }
  }

  // 2. Get creator dashboard stats
  async getMyEarnings(userId: string) {
    let earnings = await this.earningModel.findOne({ user: new Types.ObjectId(userId) });
    if (!earnings) {
      earnings = await this.earningModel.create({ user: new Types.ObjectId(userId) });
    }
    return earnings;
  }

  // 3. MONTHLY PAYOUT CALCULATION
  async calculateMonthlyPayouts(totalAdRevenue: number) {
    const CREATOR_SHARE_PERCENTAGE = 0.55; // 55% goes to creators
    const pool = totalAdRevenue * CREATOR_SHARE_PERCENTAGE;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalViews = await this.impressionModel.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    if (totalViews === 0) return { message: 'No views to calculate' };

    const creatorViews = await this.impressionModel.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$creator', count: { $sum: 1 } } },
    ]);

    for (const creator of creatorViews) {
      const viewShare = creator.count / totalViews;
      const earningsAmount = pool * viewShare;

      await this.earningModel.findOneAndUpdate(
        { user: creator._id },
        { 
          $inc: { 
            pendingBalance: earningsAmount,
            lifetimeEarnings: earningsAmount,
            // totalQualifiedViews: creator.count, // Removed this to prevent double-counting. Views are already tracked per impression.
          } 
        },
        { upsert: true },
      );
    }

    return { message: `Distributed ₹${pool} across ${creatorViews.length} creators.` };
  }

  // 4. THE CRON JOB (Automated Monthly Payout)
  @Cron('0 0 1 * *') // Runs at 00:00 on the 1st of every month
  async handleMonthlyPayouts() {
    console.log('⏰ [CRON] Starting monthly payout calculation...');
    
    // For testing purposes, we set a fixed revenue.
    // In reality, you would fetch this from Google AdSense or your ad network.
    const totalAdRevenue = 50000; 

    try {
      const result = await this.calculateMonthlyPayouts(totalAdRevenue);
      console.log('✅ [CRON] Payouts distributed:', result.message);
    } catch (error) {
      console.error('❌ [CRON] Failed to distribute payouts:', error);
    }
  }
}