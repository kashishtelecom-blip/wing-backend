import { Controller, Get, Post, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { EarningsService } from './earnings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('earnings')
export class EarningsController {
  constructor(private readonly earningsService: EarningsService) {}

  // 1. Get creator dashboard (Called when opening the Creator Earnings page)
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyEarnings(@Request() req) {
    return this.earningsService.getMyEarnings(req.user.userId);
  }

  // 2. Track a view (Called by your frontend trackWingView)
  @UseGuards(JwtAuthGuard)
  @Post('track')
  async trackImpression(@Body() body: { wingId: string }, @Request() req) {
    return this.earningsService.trackImpression(body.wingId, req.user.userId);
  }

  // 3. Request a payout (Called by the "Request Payout" button)
  @UseGuards(JwtAuthGuard)
  @Post('request-payout')
  async requestPayout(@Request() req) {
    const earnings = await this.earningsService.getMyEarnings(req.user.userId);
    
    // Policy Check: Minimum ₹500
    const MINIMUM_THRESHOLD = 500;
    if (!earnings || earnings.pendingBalance < MINIMUM_THRESHOLD) {
      throw new BadRequestException(`You need at least ₹${MINIMUM_THRESHOLD} to withdraw. Current balance: ₹${earnings?.pendingBalance || 0}`);
    }

    // NOTE: Here you would integrate Razorpay/Stripe to actually send the money.
    // For now, we will just deduct the balance to simulate a successful payout.
    
    const payoutAmount = earnings.pendingBalance;
    
    // Reset the balance to 0
    earnings.pendingBalance = 0;
    await earnings.save();

    return { 
      success: true, 
      message: 'Payout requested successfully', 
      amount: payoutAmount 
    };
  }
}