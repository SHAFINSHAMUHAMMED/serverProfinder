import multer from 'multer';

function creatmullter() {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, '');
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    }
  });
  const upload = multer({ storage: storage }) 
  return upload;
}

export default creatmullter;
