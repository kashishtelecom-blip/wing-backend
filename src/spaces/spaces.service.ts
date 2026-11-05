import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Space, SpaceDocument } from './schemas/space.schema';

@Injectable()
export class SpacesService {
  constructor(@InjectModel(Space.name) private spaceModel: Model<SpaceDocument>) {}

  async createSpace(userId: string, title: string) {
    const space = await this.spaceModel.create({
      title,
      host: new Types.ObjectId(userId),
    });
    return space;
  }

  async getAllLiveSpaces() {
    return this.spaceModel.find({ isLive: true }).populate('host', 'name username avatarUrl isVerified');
  }

  async getSpaceById(id: string) {
    const space = await this.spaceModel.findById(id).populate('host', 'name username avatarUrl isVerified');
    if (!space) throw new NotFoundException('Space not found');
    return space;
  }
}