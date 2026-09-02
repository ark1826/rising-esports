import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: (process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME || '').trim(),
  api_key: (process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_KEY || '').trim(),
  api_secret: (process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_SECRET || '').trim(),
  secure: true,
});

/**
 * Upload a buffer to Cloudinary using upload_stream
 * @param {Buffer} buffer - File buffer from Multer memoryStorage
 * @param {string} folder - Destination folder in Cloudinary
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
export const uploadToCloudinary = (buffer, folder = 'rising-esports') => {
  return new Promise((resolve, reject) => {
    const isConfigured =
      Boolean(process.env.CLOUDINARY_URL) ||
      Boolean(
        (process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME) &&
        (process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_KEY) &&
        (process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_SECRET)
      );

    if (!isConfigured) {
      return reject(new Error('Cloudinary credentials missing. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in server/.env'));
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    stream.end(buffer);
  });
};

export default cloudinary;
