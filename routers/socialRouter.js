const { Router } = require("express");
const { createComment, deleteComment, getAllCommentsByPost } = require("../controllers/commentController");
const { toggleLikeDislike, getAllLikesByPost } = require("../controllers/likeController");
const { CreateLike } = require("../controllers/likeController-v2");


const router = Router();
router.post("/api/like/create", CreateLike);
router.post("/api/like-toggle", toggleLikeDislike);
router.get("/api/all-like-by-post/:postId", getAllLikesByPost);

// comment.routes.ts
router.post("/api/comment/create", createComment);
router.post("/api/comment/delete/:id", deleteComment);
router.get("/api/all-comment-by-post/:postId", getAllCommentsByPost);

module.exports = router;