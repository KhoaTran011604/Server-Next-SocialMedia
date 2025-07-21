const  {Router} = require('express');
const { GetAllCategory, SeachCategory, CreateCategory, UpdateCategory, DeleteCategory, GetAllCategoryFK } = require('../controllers/categoryController');
const router = Router();


router.post("/api/category/get-all",GetAllCategory)
router.post("/api/category/get-all-fk",GetAllCategoryFK)
router.post("/api/category/search/:id",SeachCategory)
router.post("/api/category/update/:id",UpdateCategory)
router.post("/api/category/create",CreateCategory)
router.post("/api/category/delete/:id",DeleteCategory)



module.exports = router