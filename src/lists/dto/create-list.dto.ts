import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  MaxLength,
  MinLength,
  ArrayMaxSize,
} from 'class-validator';

export class CreateListDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4)
  emoji?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class AddListMembersDto {
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  userIds: string[];
}