import { CloudinaryProvider } from './cloudinary.provider';
import { v2 as cloudinary } from 'cloudinary';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
  },
}));

describe('CloudinaryProvider', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();

    process.env = {
      ...OLD_ENV,
      CLOUDINARY_CLOUD_NAME: 'test-cloud',
      CLOUDINARY_API_KEY: 'test-key',
      CLOUDINARY_API_SECRET: 'test-secret',
    };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('should configure cloudinary with env variables', () => {
    (cloudinary.config as jest.Mock).mockReturnValue({
      cloud_name: 'test-cloud',
      api_key: 'test-key',
      api_secret: 'test-secret',
    });

    const result = CloudinaryProvider.useFactory();

    expect(cloudinary.config).toHaveBeenCalledWith({
      cloud_name: 'test-cloud',
      api_key: 'test-key',
      api_secret: 'test-secret',
    });

    expect(result).toEqual({
      cloud_name: 'test-cloud',
      api_key: 'test-key',
      api_secret: 'test-secret',
    });
  });
});