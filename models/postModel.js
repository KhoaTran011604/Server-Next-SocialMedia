const mongoose = require('mongoose')

const _Schema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
        content: {
            type: String,
            default: false,
            require
        },
        images: {
            type: Array
        },
        hashTags: {
            type: Array,
            default: []
        },
        likes: {
            type: Array,
            default: []
        },
        comments: {
            type: Array,
            default: []
        },
        status: { type: String, enum: ['DisApprove', 'Approve', 'Block'], default: 'DisApprove' }

    },
    {
        timestamps: true, // tự động tạo createdAt và updatedAt
    }
);


module.exports = mongoose.model("posts", _Schema)