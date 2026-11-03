import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule], // To use UsersService
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}