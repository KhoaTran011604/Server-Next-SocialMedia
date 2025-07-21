const { Router } = require("express");
//const upload = require("../middleware/tmp/uploadMiddleware");
const upload = require("../middleware/tmp/uploadCloudinaryMiddleware");
const {
    GetAllOrder,
    GetAllOrderFK,
    SeachOrder,
    CreateOrder,
    UpdateOrder,
    DeleteOrder,
    CreateOrder_UploadMulti,
    UpdateOrder_UploadMulti,
} = require("../controllers/orderController");

const router = Router();

router.post("/api/order/get-all", GetAllOrder);
router.post("/api/order/get-all-fk", GetAllOrderFK);
router.post("/api/order/search/:id", SeachOrder);
router.post("/api/order/create", CreateOrder);
router.post("/api/order/update/:id", UpdateOrder);
router.post("/api/order/create-upload-multi", upload.array("files", 5), CreateOrder_UploadMulti)
router.post("/api/order/update-upload-multi/:id", upload.array("files", 5), UpdateOrder_UploadMulti)
router.post("/api/order/delete/:id", DeleteOrder);

module.exports = router;
