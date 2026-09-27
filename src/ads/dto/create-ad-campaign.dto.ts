import { IsString, IsNumber, IsOptional, IsMongoId, Min, MaxLength } from 'class-validator';

export class CreateAdCampaignDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @MaxLength(50)
  objective: string;

  @IsOptional()
  @IsMongoId()
  wing?: string;

  @IsNumber()
  @Min(1)
  dailyBudget: number;
}

export class UpdateAdCampaignDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  dailyBudget?: number;
}