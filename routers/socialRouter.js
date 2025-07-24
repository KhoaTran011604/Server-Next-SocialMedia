const { Router } = require("express");
const { createComment, deleteComment, getAllCommentsByPost } = require("../controllers/commentController");
const { toggleLikeDislike, getAllLikesByPost, CreateLike } = require("../controllers/likeController");

const { sendMessage, getMessages, getUsersForSidebar } = require("../controllers/messageController");
const { VerifyTokenMiddleware } = require("../controllers/authController");


const router = Router();
router.post("/api/like/create", CreateLike);
router.post("/api/like-toggle", toggleLikeDislike);
router.get("/api/all-like-by-post/:postId", getAllLikesByPost);


router.post("/api/comment/create", createComment);
router.post("/api/comment/delete/:id", deleteComment);
router.get("/api/all-comment-by-post/:postId", getAllCommentsByPost);

router.post("/api/message/get-all-user-online", VerifyTokenMiddleware, getUsersForSidebar);
router.get("/api/message/get-all-with/:userToChatId", VerifyTokenMiddleware, getMessages);
router.post("/api/message/send/:id", VerifyTokenMiddleware, sendMessage);





module.exports = router;