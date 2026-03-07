import { Test, TestingModule } from '@nestjs/testing';
import { GoogleBooksService } from './google-books.service';
import { ConfigService } from '@nestjs/config';
import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('GoogleBooksService', () => {
  let service: GoogleBooksService;

  const mockApiKey = 'fake-api-key';
  const mockIsbn = '9788415594079';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleBooksService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(mockApiKey),
          },
        },
      ],
    }).compile();

    service = module.get<GoogleBooksService>(GoogleBooksService);
    mockedAxios.isAxiosError.mockReturnValue(false);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return book data correctly on success', async () => {
    const apiResponse = {
      data: {
        items: [
          {
            volumeInfo: {
              title: 'El nombre del viento',
              authors: ['Patrick Rothfuss'],
              description: 'Una gran historia...',
              pageCount: 800,
              categories: ['Fantasía'],
              imageLinks: {
                thumbnail: 'http://image-link.com/thumb.jpg',
              },
            },
          },
        ],
      },
    };

    mockedAxios.get.mockResolvedValue(apiResponse);
    const result = await service.findByIsbn(mockIsbn);

    expect(result).toEqual({
      title: 'El nombre del viento',
      authors: ['Patrick Rothfuss'],
      description: 'Una gran historia...',
      pageCount: 800,
      genre: 'Fantasía',
      urlPortada: 'https://image-link.com/thumb.jpg',
    });
  });

  it('should throw NotFoundException when items property is missing', async () => {
    mockedAxios.get.mockResolvedValue({ data: {} });

    await expect(service.findByIsbn(mockIsbn)).rejects.toThrow(
      new NotFoundException(
        `No se encontró ningún libro con el ISBN: ${mockIsbn}`,
      ),
    );
  });

  it('should throw NotFoundException when items array is empty', async () => {
    mockedAxios.get.mockResolvedValue({ data: { items: [] } });

    await expect(service.findByIsbn(mockIsbn)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should handle Axios error with response data (Quota Exceeded)', async () => {
    const axiosError = {
      response: { data: 'Quota Exceeded' },
      message: 'Request failed',
    };

    mockedAxios.isAxiosError.mockReturnValueOnce(true);
    mockedAxios.get.mockRejectedValue(axiosError);

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    await expect(service.findByIsbn(mockIsbn)).rejects.toThrow(
      InternalServerErrorException,
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.any(String),
      'Quota Exceeded',
    );
  });

  it('should handle Axios error WITHOUT response data', async () => {
    const axiosError = {
      response: { data: null },
      message: 'Connection Timeout',
    };

    mockedAxios.isAxiosError.mockReturnValueOnce(true);
    mockedAxios.get.mockRejectedValue(axiosError);

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    await expect(service.findByIsbn(mockIsbn)).rejects.toThrow(
      InternalServerErrorException,
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.any(String),
      'Connection Timeout',
    );
  });

  it('should handle generic Error instance', async () => {
    const genericError = new Error('Generic Error');
    mockedAxios.isAxiosError.mockReturnValue(false);
    mockedAxios.get.mockRejectedValue(genericError);

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    await expect(service.findByIsbn(mockIsbn)).rejects.toThrow(
      InternalServerErrorException,
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.any(String),
      'Generic Error',
    );
  });

  it('should handle non-object errors (Unknown error)', async () => {
    mockedAxios.isAxiosError.mockReturnValue(false);
    mockedAxios.get.mockRejectedValue('String Error');

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    await expect(service.findByIsbn(mockIsbn)).rejects.toThrow(
      InternalServerErrorException,
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.any(String),
      'Unknown error',
    );
  });

  it('should rethrow error if it is already a NotFoundException', async () => {
    mockedAxios.get.mockResolvedValue({ data: { items: [] } });

    await expect(service.findByIsbn(mockIsbn)).rejects.toThrow(
      NotFoundException,
    );
  });
});
