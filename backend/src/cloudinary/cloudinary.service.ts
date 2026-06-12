import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  uploadFile(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const resourceType =
        file.mimetype === 'application/pdf' ? 'raw' : 'image';
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          access_mode: 'public',
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error) {
            return reject(
              new Error(
                error instanceof Error ? error.message : JSON.stringify(error),
              ),
            );
          }

          resolve(result!);
        },
      );
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }
}
