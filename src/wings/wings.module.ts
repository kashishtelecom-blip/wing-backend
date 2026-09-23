import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WingsController } from './wings.controller';
import { WingsService } from './wings.service';
import { Wing, WingSchema } from './schemas/wing.schema';
import { WingEdit, WingEditSchema } from './schemas/wing-edit.schema';
import { PollVote, PollVoteSchema } from './schemas/poll-vote.schema';
import { CopyrightReport, CopyrightReportSchema } from './schemas/copyright-report.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { LikesModule } from '../likes/likes.module';
import { FollowsModule } from '../follows/follows.module';
import { BookmarksModule } from '../bookmarks/bookmarks.module';
import { RepostsModule } from '../reposts/reposts.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ScheduledWingsCron } from './scheduled-wings.cron';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Wing.name, schema: WingSchema },
      { name: WingEdit.name, schema: WingEditSchema },
      { name: PollVote.name, schema: PollVoteSchema },
      { name: CopyrightReport.name, schema: CopyrightReportSchema },
      { name: User.name, schema: UserSchema },
    ]),
    LikesModule,
    FollowsModule,
    BookmarksModule,
    RepostsModule,
    NotificationsModule,
  ],
  controllers: [WingsController],
  providers: [WingsService, ScheduledWingsCron],
  exports: [WingsService],
})
export class WingsModule {}