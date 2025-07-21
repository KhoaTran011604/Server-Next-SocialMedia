const { Router } = require('express');
const { GetAllTodo, CreateTodo, UpdateTodo, DeleteTodo, GetAllTodoFK, CompletedTodo, GetCompletedTodo, TestTodo, SeachTodo, GetAllTodo_WithoutPanigation, GetCompletedTodo_WithoutPanigation } = require('../controllers/todoController');
const { AuthVertify, VerifyToken, VerifyTokenMiddleware } = require('../controllers/authController');

const router = Router();

router.get("/api/todo/test", TestTodo)
router.post("/api/todo/get-all", VerifyTokenMiddleware, GetAllTodo)
router.post("/api/todo/get-completed", GetCompletedTodo)
router.post("/api/todo/get-all-fk", GetAllTodoFK)
router.post("/api/todo/search/:id", SeachTodo)
router.post("/api/todo/update/:id", UpdateTodo)
router.post("/api/todo/completed/:id", CompletedTodo)
router.post("/api/todo/create", CreateTodo)
router.post("/api/todo/delete/:id", DeleteTodo)
router.post("/api/todo/get-all-no-panigation", GetAllTodo_WithoutPanigation)
router.post("/api/todo/get-completed-no-panigation", GetCompletedTodo_WithoutPanigation)



module.exports = router