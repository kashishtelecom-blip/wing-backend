import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdsController } from './ads.controller';
import { AdsService } from './ads.service';
import { AdCampaign, AdCampaignSchema } from './schemas/ad-campaign.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AdCampaign.name, schema: AdCampaignSchema }]),
  ],
  controllers: [AdsController],
  providers: [AdsService],
  exports: [AdsService],
})
export class AdsModule {}