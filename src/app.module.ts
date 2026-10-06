import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { WingsModule } from './wings/wings.module';
import { CommentsModule } from './comments/comments.module';
import { SearchModule } from './search/search.module';
import { ChatModule } from './chat/chat.module';
import { CommunitiesModule } from './communities/communities.module';
import { ListsModule } from './lists/lists.module';
import { WaitlistModule } from './waitlist/waitlist.module';
import { AdsModule } from './ads/ads.module';
import { LikesModule } from './likes/likes.module';
import { FollowsModule } from './follows/follows.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RepostsModule } from './reposts/reposts.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 1000,
      },
    ]),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
    }),
    
    UsersModule,
    AdminModule,
    AuthModule,
    WingsModule,
    CommentsModule,
    SearchModule,
    ChatModule,
    CommunitiesModule,
    ListsModule,
    WaitlistModule,
    AdsModule,
    LikesModule,
    FollowsModule,
    BookmarksModule,
    NotificationsModule,
    RepostsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}