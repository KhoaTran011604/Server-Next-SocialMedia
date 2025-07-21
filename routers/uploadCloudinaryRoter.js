const express = require("express");
const router = express.Router();
const uploadCloudinary = require("../middleware/tmp/uploadCloudinaryMiddleware");
const uploadCloudinaryController = require("../controllers/uploadCloudinaryController");

// // Route upload 1 ảnh
// router.post("/upload-single", upload.single("file"), uploadController.uploadSingleImage);

// Route upload nhiều ảnh (tối đa 5)
router.post("/api/upload-cloudinary-multiple", uploadCloudinary.array("files", 5), uploadCloudinaryController.uploadCloudinaryMultipleImages);

module.exports = router;
