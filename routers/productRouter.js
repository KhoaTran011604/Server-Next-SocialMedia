const { Router } = require('express');
const { GetAllProduct, SeachProduct, CreateProduct, UpdateProduct, DeleteProduct, CreateProduct_UploadMulti, UpdateProduct_UploadMulti, ImportProducts, ExportProducts, ExportWithFilter, ExportAllProduct, GetAllProductFK } = require('../controllers/productController');
//const upload = require("../middleware/tmp/uploadMiddleware");
const upload = require("../middleware/tmp/uploadCloudinaryMiddleware");
const uploadExcelFile = require("../middleware/tmp/uploadExcelFileMiddleware");

const router = Router();




//files là thuộc tính lưu file đơn or list file của formData FE gửi về

router.post("/api/product/get-all", GetAllProduct)
router.post("/api/product/get-all-fk", GetAllProductFK)
router.post("/api/product/search/:id", SeachProduct)
router.post("/api/product/create", upload.single("files"), CreateProduct)
router.post("/api/product/create-upload-multi", upload.array("files", 5), CreateProduct_UploadMulti)
router.post("/api/product/update/:id", upload.single("files"), UpdateProduct)
router.post("/api/product/update-upload-multi/:id", upload.array("files", 5), UpdateProduct_UploadMulti)
router.post("/api/product/delete/:id", DeleteProduct)

//router.post("/api/product/import",upload.single("files"),ImportProducts)
router.post("/api/product/import", uploadExcelFile.single("files"), ImportProducts)
router.post("/api/product/export", ExportWithFilter)
router.post("/api/product/export-all", ExportAllProduct)




module.exports = router