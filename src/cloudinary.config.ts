import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'wing/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
  } as any,
});

export const mediaStorage = new CloudinaryStorage({
  cloudinary,
  params: async (_req: any, file: any) => {
    const isVideo = /\.(mp4|webm|mov|m4v)$/i.test(file.originalname);
    const isAudio =
      file.mimetype?.startsWith('audio/') ||
      /\.(mp3|wav|ogg|m4a|webm)$/i.test(file.originalname);

    return {
      folder: 'wing/media',
      // Cloudinary stores audio under the 'video' resource type
      resource_type: isVideo || isAudio ? 'video' : 'image',
      allowed_formats: isVideo
        ? ['mp4', 'webm', 'mov', 'm4v']
        : isAudio
        ? ['mp3', 'wav', 'ogg', 'm4a', 'webm']
        : ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    };
  },
});

export { cloudinary };