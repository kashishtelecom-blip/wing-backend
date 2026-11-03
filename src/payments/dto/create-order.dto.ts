import { IsNumber, IsNotEmpty, Min } from 'class-validator';

export class CreateOrderDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  amount: number;
}