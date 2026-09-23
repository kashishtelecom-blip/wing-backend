import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WingsService } from './wings.service';

@Injectable()
export class ScheduledWingsCron {
  private readonly logger = new Logger(ScheduledWingsCron.name);

  constructor(private readonly wingsService: WingsService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledPublish() {
    try {
      const count = await this.wingsService.publishScheduledWings();
      if (count > 0) {
        this.logger.log('Published ' + count + ' scheduled wing(s)');
      }
    } catch (err) {
      this.logger.error('Failed to publish scheduled wings', err);
    }
  }
}