import { Test, TestingModule } from '@nestjs/testing';
import { GoogleBooksService } from './google-books.service';

describe('GoogleBooksService', () => {
  let service: GoogleBooksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GoogleBooksService],
    }).compile();

    service = module.get<GoogleBooksService>(GoogleBooksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
