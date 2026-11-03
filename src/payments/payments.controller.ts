import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-order')
  async createOrder(@Body() body: CreateOrderDto) {
    return this.paymentsService.createOrder(body.amount);
  }

  @Post('verify')
  async verify(
    @Request() req: any,
    @Body() body: { orderId: string; paymentId: string; signature: string },
  ) {
    return this.paymentsService.verifyPayment(
      req.user.userId,
      body.orderId,
      body.paymentId,
      body.signature,
    );
  }
}