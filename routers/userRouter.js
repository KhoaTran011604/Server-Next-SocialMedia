const { Router } = require("express");
//const upload = require("../middleware/tmp/uploadMiddleware");
const upload = require("../middleware/tmp/uploadCloudinaryMiddleware");
const {
    GetAllUser,
    GetAllUserFK,
    SeachUser,
    CreateUser,
    UpdateUser,
    DeleteUser,
    CreateUser_UploadMulti,
    UpdateUser_UploadMulti,
    UserChangePassword,
    UserChangeStatus,
    UpdateInfoByUser_UploadMulti,
} = require("../controllers/userController");

const router = Router();

router.post("/api/user/get-all", GetAllUser);
router.post("/api/user/get-all-fk", GetAllUserFK);
router.post("/api/user/search/:id", SeachUser);
router.post("/api/user/create", CreateUser);
router.post("/api/user/update/:id", UpdateUser);
router.post("/api/user/create-upload-multi", upload.array("files", 5), CreateUser_UploadMulti)
router.post("/api/user/update-upload-multi/:id", upload.array("files", 5), UpdateUser_UploadMulti)
router.post("/api/user/update-info-by-user/:id", upload.array("files", 5), UpdateInfoByUser_UploadMulti)
router.post("/api/user/delete/:id", DeleteUser);
router.post("/api/user/change-password/:id", UserChangePassword);
router.post("/api/user/change-status/:id", UserChangeStatus);

module.exports = router;
