import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AdCampaign, AdCampaignDocument, AdStatus } from './schemas/ad-campaign.schema';
import { CreateAdCampaignDto, UpdateAdCampaignDto } from './dto/create-ad-campaign.dto';

@Injectable()
export class AdsService {
  constructor(
    @InjectModel(AdCampaign.name) private adModel: Model<AdCampaignDocument>,
  ) {}

  async create(userId: string, dto: CreateAdCampaignDto) {
    return this.adModel.create({
      name: dto.name.trim(),
      objective: dto.objective.trim(),
      wing: dto.wing ? new Types.ObjectId(dto.wing) : undefined,
      dailyBudget: dto.dailyBudget,
      owner: new Types.ObjectId(userId),
      status: AdStatus.DRAFT,
    });
  }

  async findMine(userId: string) {
    return this.adModel
      .find({ owner: new Types.ObjectId(userId) })
      .populate('wing', 'title')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(userId: string, id: string) {
    const campaign = await this.adModel
      .findById(id)
      .populate('wing', 'title')
      .exec();
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.owner.toString() !== userId) {
      throw new ForbiddenException('Not your campaign');
    }
    return campaign;
  }

  async update(userId: string, id: string, dto: UpdateAdCampaignDto) {
    const campaign = await this.adModel.findById(id);
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.owner.toString() !== userId) {
      throw new ForbiddenException('Not your campaign');
    }
    if (dto.name !== undefined) campaign.name = dto.name;
    if (dto.dailyBudget !== undefined) campaign.dailyBudget = dto.dailyBudget;
    if (dto.status !== undefined) campaign.status = dto.status as AdStatus;
    return campaign.save();
  }

  async remove(userId: string, id: string) {
    const campaign = await this.adModel.findById(id);
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.owner.toString() !== userId) {
      throw new ForbiddenException('Not your campaign');
    }
    await campaign.deleteOne();
    return { deleted: true };
  }
}