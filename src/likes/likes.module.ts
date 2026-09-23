import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LikesService } from './likes.service';
import { Like, LikeSchema } from './schemas/like.schema';
import { Wing, WingSchema } from '../wings/schemas/wing.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Like.name, schema: LikeSchema },
      { name: Wing.name, schema: WingSchema },
    ]),
     NotificationsModule,
  ],
  providers: [LikesService],
  exports: [LikesService],
})
export class LikesModule {}