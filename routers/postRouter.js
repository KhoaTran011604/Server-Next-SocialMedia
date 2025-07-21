const { Router } = require("express");
//const upload = require("../middleware/tmp/uploadMiddleware");
const upload = require("../middleware/tmp/uploadCloudinaryMiddleware");
const {
    GetAllPost,
    GetAllPostFK,
    SeachPost,
    CreatePost,
    UpdatePost,
    DeletePost,
    CreatePost_UploadMulti,
    UpdatePost_UploadMulti,
} = require("../controllers/postController");

const router = Router();

router.post("/api/post/get-all", GetAllPost);
router.post("/api/post/get-all-fk", GetAllPostFK);
router.post("/api/post/search/:id", SeachPost);
router.post("/api/post/create", CreatePost);
router.post("/api/post/update/:id", UpdatePost);
router.post("/api/post/create-upload-multi", upload.array("files", 5), CreatePost_UploadMulti)
router.post("/api/post/update-upload-multi/:id", upload.array("files", 5), UpdatePost_UploadMulti)
router.post("/api/post/delete/:id", DeletePost);

module.exports = router;
