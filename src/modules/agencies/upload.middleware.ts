import { diskStorage } from 'multer';

export const agencyImageFileFilter = (req, file, cb) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
    return cb(new Error('Unsupported file type'), false);
  }
  cb(null, true);
};

export const agencyStorage = diskStorage({
  destination: './uploads/agencies',
  filename: (req, file, cb) => {
    const name = file.originalname.split(' ').join('-');
    cb(null, `${Date.now()}-${name}`);
  },
});

export default {
  storage: agencyStorage,
  fileFilter: agencyImageFileFilter,
};