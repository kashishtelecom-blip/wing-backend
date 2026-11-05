import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SpacesController } from './spaces.controller';
import { SpacesService } from './spaces.service';
import { Space, SpaceSchema } from './schemas/space.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Space.name, schema: SpaceSchema }])],
  controllers: [SpacesController],
  providers: [SpacesService],
})
export class SpacesModule {}