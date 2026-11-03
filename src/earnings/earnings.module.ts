import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EarningsService } from './earnings.service';
import { EarningsController } from './earnings.controller';
import { AdImpression, AdImpressionSchema } from './schemas/ad-impression.schema';
import { CreatorEarning, CreatorEarningSchema } from './schemas/creator-earning.schema';
import { Wing, WingSchema } from '../wings/schemas/wing.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AdImpression.name, schema: AdImpressionSchema },
      { name: CreatorEarning.name, schema: CreatorEarningSchema },
      { name: Wing.name, schema: WingSchema },
    ]),
  ],
  controllers: [EarningsController],
  providers: [EarningsService],
  exports: [EarningsService],
})
export class EarningsModule {}