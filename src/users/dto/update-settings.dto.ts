import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsIn, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PrivacySettingsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  privateAccount?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  showActivity?: boolean;

  @ApiProperty({ required: false, enum: ['everyone', 'followers', 'nobody'] })
  @IsOptional()
  @IsIn(['everyone', 'followers', 'nobody'])
  allowDMsFrom?: 'everyone' | 'followers' | 'nobody';
}

class NotificationSettingsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  inAppNotifications?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  emailOnMention?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  emailOnFollow?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  emailOnLike?: boolean;
}

class ContentSettingsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  showSensitiveContent?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  autoplayVideos?: boolean;
}

export class UpdateSettingsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => PrivacySettingsDto)
  privacy?: PrivacySettingsDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationSettingsDto)
  notifications?: NotificationSettingsDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => ContentSettingsDto)
  content?: ContentSettingsDto;
}