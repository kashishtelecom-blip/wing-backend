import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';
import { BusinessPage, BusinessPageSchema } from './schemas/business-page.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: BusinessPage.name, schema: BusinessPageSchema }]),
  ],
  controllers: [BusinessController],
  providers: [BusinessService],
  exports: [BusinessService],
})
export class BusinessModule {}