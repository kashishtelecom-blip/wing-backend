import { Test, TestingModule } from '@nestjs/testing';
import { WingsController } from './wings.controller';

describe('WingsController', () => {
  let controller: WingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WingsController],
    }).compile();

    controller = module.get<WingsController>(WingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
