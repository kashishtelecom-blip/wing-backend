import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Wing, WingSchema } from '../wings/schemas/wing.schema';
import { Comment, CommentSchema } from '../comments/schemas/comment.schema';
import { Community, CommunitySchema } from '../communities/schemas/community.schema';
import { CopyrightReport, CopyrightReportSchema } from '../wings/schemas/copyright-report.schema';
// 1. Import the CreatorEarning schema
import { CreatorEarning, CreatorEarningSchema } from '../earnings/schemas/creator-earning.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Wing.name, schema: WingSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: Community.name, schema: CommunitySchema },
      { name: CopyrightReport.name, schema: CopyrightReportSchema },
      // 2. Register it here
      { name: CreatorEarning.name, schema: CreatorEarningSchema }, 
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}