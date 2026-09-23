import { IsString, IsOptional, IsBoolean, IsArray, MaxLength, MinLength, ArrayMaxSize } from 'class-validator';

export class CreateCommunityDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name: string;

  @IsString()
  @MinLength(3)
  @MaxLength(300)
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(4)
  emoji?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  tags?: string[];
}