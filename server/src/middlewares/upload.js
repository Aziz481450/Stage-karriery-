import multer from 'multer';

const cvFilter = (_req, file, cb) => {
  const ext = /\.pdf$/i.test(file.originalname);
  const mime = file.mimetype === 'application/pdf' || file.mimetype === 'application/octet-stream';
  if (ext && mime) return cb(null, true);
  cb(new multer.MulterError('INVALID_FILE', 'Seuls les fichiers PDF sont acceptés.'));
};

const fichierFilter = (_req, file, cb) => {
  const allowed = [
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'text/plain'
  ];
  const ext = /\.(pdf|doc|docx|png|jpg|jpeg|gif|webp|txt)$/i.test(file.originalname);
  if (ext && allowed.includes(file.mimetype)) return cb(null, true);
  cb(new multer.MulterError('INVALID_FILE', 'Type de fichier non autorisé (PDF, images, DOC/DOCX, TXT).'));
};

export const uploadCv = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: cvFilter
});

export const uploadFichier = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: fichierFilter
});

const imageFilter = (_req, file, cb) => {
  const ext = /\.(png|jpe?g|webp|gif)$/i.test(file.originalname);
  if (ext && file.mimetype.startsWith('image/')) return cb(null, true);
  cb(new multer.MulterError('INVALID_FILE', 'Image uniquement (PNG, JPG, WEBP, GIF).'));
};

export const uploadPhoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: imageFilter
});

export const multerError = (err) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return { status: 413, message: 'Fichier trop volumineux (taille maximale autorisée).' };
    if (err.code === 'LIMIT_FILE_COUNT') return { status: 400, message: 'Un seul fichier à la fois.' };
    return { status: 400, message: err.message || 'Fichier refusé.' };
  }
  return null;
};