const multer = require("multer");
const path = require("path");

// Cấu hình Multer để lưu file vào thư mục uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "imports/"); // Thư mục lưu excel file
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, uniqueName);
  },
});

// Chỉ cho phép upload ảnh (jpg, jpeg, png)
const fileFilter = (req, file, cb) => {
if (file.mimetype === "application/vnd.ms-excel" || // .xls
    file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") { // .xlsx
  cb(null, true);
} else {
  cb(new Error("Only Excel files are allowed!"), false);
}
};

// Tạo middleware upload
const upload = multer({ storage, fileFilter });

module.exports = upload;
