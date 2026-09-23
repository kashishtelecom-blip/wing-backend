import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookmarksService } from './bookmarks.service';
import { Bookmark, BookmarkSchema } from './schemas/bookmark.schema';
import { Wing, WingSchema } from '../wings/schemas/wing.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Bookmark.name, schema: BookmarkSchema },
      { name: Wing.name, schema: WingSchema },
    ]),
  ],
  providers: [BookmarksService],
  exports: [BookmarksService],
})
export class BookmarksModule {}