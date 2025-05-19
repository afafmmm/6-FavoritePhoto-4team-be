import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "src/uploads");
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const realName = `${baseName}-${Date.now()}${ext}`;
    cb(null, realName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1044, // 5mb
  },
});

export default upload;
