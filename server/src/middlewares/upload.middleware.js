import multer from 'multer';

const imageMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const storage = multer.memoryStorage();

function fileFilter(req, file, callback) {
  if (!imageMimeTypes.includes(file.mimetype)) {
    return callback(new Error('Chi chap nhan file anh JPG, PNG, WEBP hoac GIF.'));
  }

  return callback(null, true);
}

export const uploadProductImages = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 8
  }
});
