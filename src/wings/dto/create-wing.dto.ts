import { IsOptional, IsString, IsBoolean, IsObject } from 'class-validator';

export class CreateWingDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @IsOptional()
  @IsString()
  scheduledAt?: string;

  @IsOptional()
  @IsBoolean()
  commentsEnabled?: boolean;

  @IsOptional()
  @IsObject()
  poll?: any;

  @IsOptional()
  @IsString()
  pageId?: string;  // <-- ADD THIS
}