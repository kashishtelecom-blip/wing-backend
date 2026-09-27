import { IsString, IsEmail, IsOptional, MaxLength } from 'class-validator';

export class JoinWaitlistDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  source?: string;
}