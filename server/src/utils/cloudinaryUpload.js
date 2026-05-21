import cloudinary, { assertCloudinaryConfigured } from '../config/cloudinary.js';
import env from '../config/env.js';

export function uploadBufferToCloudinary(fileBuffer, options = {}) {
  assertCloudinaryConfigured();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: env.cloudinary.productFolder,
        resource_type: 'image',
        ...options
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
}
