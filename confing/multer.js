import multer from 'multer';

function creatmullter() {
  console.log('1')
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, '');
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    }
  });
  console.log('2')

  const upload = multer({ storage: storage }) 
  console.log(upload,'jjjjjjjjjjjjjjjjjjjjjj')
  return upload;
}

export default creatmullter;
