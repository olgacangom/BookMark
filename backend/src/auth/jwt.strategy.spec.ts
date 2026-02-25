import { JwtStrategy } from './jwt.strategy';
import { Test, TestingModule } from '@nestjs/testing';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtStrategy],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should validate and return user payload', async () => {
    const payload = { sub: 'uuid', email: 'test@test.com' };
    const result = await strategy.validate(payload);
    expect(result).toEqual({ userId: 'uuid', email: 'test@test.com' });
  });
});