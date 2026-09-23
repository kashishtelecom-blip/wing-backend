import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsDateString,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

class PollOptionDto {
  @IsString()
  @MaxLength(80)
  text: string;
}

class PollDto {
  @IsString()
  @MaxLength(200)
  question: string;

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => PollOptionDto)
  options: PollOptionDto[];

  @IsDateString()
  endsAt: string;
}

export class CreateWingDto {
  @IsString()
  @MaxLength(100)
  title: string;

  @IsString()
  @MaxLength(800)
  content: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

 @IsOptional()
  @IsBoolean()
  commentsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PollDto)
  poll?: PollDto;
}