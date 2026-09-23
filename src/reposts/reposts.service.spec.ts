import { Test, TestingModule } from '@nestjs/testing';
import { RepostsService } from './reposts.service';

describe('RepostsService', () => {
  let service: RepostsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RepostsService],
    }).compile();

    service = module.get<RepostsService>(RepostsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
