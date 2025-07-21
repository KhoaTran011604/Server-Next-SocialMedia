const express = require('express')
const mongoose = require('mongoose')
require('dotenv').config()
const cors = require('cors')
const cookieParser = require('cookie-parser');
const app = express()

const todoRouter = require('./routers/todoRouter')

const productRouter = require('./routers/productRouter')
const categoryRouter = require('./routers/categoryRouter')
const authRouter = require('./routers/authRouter')
const userRouter = require("./routers/userRouter");
const orderRouter = require("./routers/orderRouter");
const reviewRouter = require("./routers/reviewRouter");
const cartRouter = require("./routers/cartRouter");
const postRouter = require("./routers/postRouter");
const uploadCloudinaryRoter = require("./routers/uploadCloudinaryRoter");
const { VerifyTokenMiddleware } = require('./controllers/authController')






const PORT = process.env.PORT || 5000
app.use(express.json())
app.use(cors())



app.use('/api/todo', VerifyTokenMiddleware); // chỉ áp dụng với /api/todo
// app.use('/api/product', VerifyTokenMiddleware);
// app.use('/api/category', VerifyTokenMiddleware);
// app.use('/api/order', VerifyTokenMiddleware);
// app.use('/api/review', VerifyTokenMiddleware);
// app.use('/api/user', VerifyTokenMiddleware);

//require("./helpers/cronJobs");

// Cho phép truy cập ảnh từ thư mục "uploads"
app.use("/uploads", express.static("uploads"));
// Cho phép truy file từ thư mục "imports/exports"
app.use("/exports", express.static("exports"));
app.use("/imports", express.static("imports"));



app.use(todoRouter)
app.use(productRouter)
app.use(categoryRouter)
app.use(userRouter);
app.use(orderRouter);
app.use(reviewRouter);
app.use(cartRouter);
app.use(postRouter);
app.use(uploadCloudinaryRoter);
app.use(authRouter)

app.get("/", (req, res) => res.json({ response: "hello" }))

app.use(cors({
    origin: '*', // hoặc cụ thể 'http://your-expo-ip:port''https://quanlyvumua.vercel.app', // Chỉ cho phép trang web của bạn truy cập
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Mongo conected....."))
    .catch(err => console.log(err))

app.listen(PORT, () => console.log(`Listen at port ${PORT}`)
)