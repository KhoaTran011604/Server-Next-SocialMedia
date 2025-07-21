const mongoose = require('mongoose')

const _Schema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        completed: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true, // tự động tạo createdAt và updatedAt
    }
);


module.exports = mongoose.model("todos", _Schema)