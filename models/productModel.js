const mongoose = require('mongoose')

const _Schema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            default: false,
        },
        discount: Number,
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "categories",
            required: false,
        },
        status: {
            type: String,
            required: false,
        },
        description: {
            type: String,
            required: false,
        },
        images: {
            type: Array
        },
        brand: String,
        stock: Number,
        variants: [{
            id: String,
            color: String,
            size: String,
            quantity: Number
        }]
    },
    {
        timestamps: true, // tự động tạo createdAt và updatedAt
    }
);


module.exports = mongoose.model("products", _Schema)