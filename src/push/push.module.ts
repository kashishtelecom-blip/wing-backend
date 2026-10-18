import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PushService } from './push.service';
import { PushController } from './push.controller';
import { PushSubscription, PushSubscriptionSchema } from './schemas/push-subscription.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PushSubscription.name, schema: PushSubscriptionSchema },
    ]),
  ],
  controllers: [PushController],
  providers: [PushService],
  exports: [PushService], // Export so NotificationsService can use it
})
export class PushModule {}