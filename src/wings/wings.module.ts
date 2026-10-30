import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WingsService } from './wings.service';
import { WingsController } from './wings.controller';
import { Wing, WingSchema } from './schemas/wing.schema';
import { WingEdit, WingEditSchema } from './schemas/wing-edit.schema';
import { CopyrightReport, CopyrightReportSchema } from './schemas/copyright-report.schema';
import { PollVote, PollVoteSchema } from './schemas/poll-vote.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { BusinessPage, BusinessPageSchema } from '../business/schemas/business-page.schema';
import { FollowsModule } from '../follows/follows.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { LikesModule } from '../likes/likes.module';
import { BookmarksModule } from '../bookmarks/bookmarks.module';
import { RepostsModule } from '../reposts/reposts.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Wing.name, schema: WingSchema },
      { name: WingEdit.name, schema: WingEditSchema },
      { name: CopyrightReport.name, schema: CopyrightReportSchema },
      { name: PollVote.name, schema: PollVoteSchema },
      { name: User.name, schema: UserSchema },
      { name: BusinessPage.name, schema: BusinessPageSchema },
    ]),
    FollowsModule,
    NotificationsModule,
    LikesModule,
    BookmarksModule,
    RepostsModule,
  ],
  controllers: [WingsController],
  providers: [WingsService],
  exports: [WingsService],
})
export class WingsModule {}