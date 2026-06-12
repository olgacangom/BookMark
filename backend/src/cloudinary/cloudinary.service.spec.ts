import { CloudinaryService } from './cloudinary.service';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';

jest.mock('cloudinary', () => ({
  v2: {
    uploader: {
      upload_stream: jest.fn(),
    },
  },
}));

jest.mock('streamifier', () => ({
  createReadStream: jest.fn(),
}));

describe('CloudinaryService', () => {
  let service: CloudinaryService;

  beforeEach(() => {
    service = new CloudinaryService();
    jest.clearAllMocks();
  });

  const mockFile = (mimetype = 'image/png') =>
    ({
      buffer: Buffer.from('test-file'),
      mimetype,
    }) as Express.Multer.File;

  it('should upload an image file correctly', async () => {
    const file = mockFile('image/png');

    const pipeMock = jest.fn();

    (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
      (options, callback) => {
        // simulate success
        setTimeout(() => {
          callback(null, { secure_url: 'http://image.com' } as any);
        }, 0);

        return { pipe: pipeMock };
      },
    );

    (streamifier.createReadStream as jest.Mock).mockReturnValue({
      pipe: pipeMock,
    });

    const result = await service.uploadFile(file, 'test-folder');

    expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
      expect.objectContaining({
        folder: 'test-folder',
        resource_type: 'image',
        access_mode: 'public',
        use_filename: true,
        unique_filename: true,
      }),
      expect.any(Function),
    );

    expect(result).toEqual({ secure_url: 'http://image.com' });
  });

  it('should upload a pdf file as raw resource_type', async () => {
    const file = mockFile('application/pdf');

    const pipeMock = jest.fn();

    (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
      (options, callback) => {
        setTimeout(() => {
          callback(null, { secure_url: 'http://pdf.com' } as any);
        }, 0);

        return { pipe: pipeMock };
      },
    );

    (streamifier.createReadStream as jest.Mock).mockReturnValue({
      pipe: pipeMock,
    });

    const result = await service.uploadFile(file, 'docs');

    expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
      expect.objectContaining({
        folder: 'docs',
        resource_type: 'raw',
      }),
      expect.any(Function),
    );

    expect(result).toEqual({ secure_url: 'http://pdf.com' });
  });

  it('should reject when cloudinary returns an error', async () => {
    const file = mockFile();

    const pipeMock = jest.fn();

    (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
      (options, callback) => {
        setTimeout(() => {
          callback(new Error('Upload failed'), null);
        }, 0);

        return { pipe: pipeMock };
      },
    );

    (streamifier.createReadStream as jest.Mock).mockReturnValue({
      pipe: pipeMock,
    });

    await expect(service.uploadFile(file, 'error-folder')).rejects.toThrow(
      'Upload failed',
    );
  });
});
