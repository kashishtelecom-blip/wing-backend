import { Test, TestingModule } from '@nestjs/testing';
import { WingsService } from './wings.service';

describe('WingsService', () => {
  let service: WingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WingsService],
    }).compile();

    service = module.get<WingsService>(WingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
