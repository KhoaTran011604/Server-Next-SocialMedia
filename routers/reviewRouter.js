const { Router } = require("express");
const {
    GetAllReview,
    GetAllReviewFK,
    SeachReview,
    CreateReview,
    UpdateReview,
    DeleteReview,
} = require("../controllers/reviewController");

const router = Router();

router.post("/api/review/get-all", GetAllReview);
router.post("/api/review/get-all-fk", GetAllReviewFK);
router.post("/api/review/search/:id", SeachReview);
router.post("/api/review/create", CreateReview);
router.post("/api/review/update/:id", UpdateReview);
router.post("/api/review/delete/:id", DeleteReview);

module.exports = router;
