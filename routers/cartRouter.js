const { Router } = require("express");
const {
    GetAllCart,
    GetAllCartFK,
    SeachCart,
    CreateCart,
    UpdateCart,
    DeleteCart,
} = require("../controllers/cartController");

const router = Router();

router.post("/api/cart/get-all", GetAllCart);
router.post("/api/cart/get-all-fk", GetAllCartFK);
router.post("/api/cart/search/:id", SeachCart);
router.post("/api/cart/create", CreateCart);
router.post("/api/cart/update/:id", UpdateCart);
router.post("/api/cart/delete/:id", DeleteCart);

module.exports = router;
