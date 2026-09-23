import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RepostsService } from './reposts.service';
import { Repost, RepostSchema } from './schemas/repost.schema';
import { Wing, WingSchema } from '../wings/schemas/wing.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Repost.name, schema: RepostSchema },
      { name: Wing.name, schema: WingSchema },
    ]),
    NotificationsModule,
  ],
  providers: [RepostsService],
  exports: [RepostsService],
})
export class RepostsModule {}