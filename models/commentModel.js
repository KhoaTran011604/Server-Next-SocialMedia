const mongoose = require('mongoose')

const _Schema = new mongoose.Schema({
    userId: { type: mongoose.Types.ObjectId, ref: "users", required: true },
    postId: { type: mongoose.Types.ObjectId, ref: "posts", required: true },
    content: { type: String, required: true },
    parentId: { type: mongoose.Types.ObjectId, ref: "comments", default: null }, // reply 1 cấp
}, { timestamps: true }
)

module.exports = mongoose.model("comments", _Schema)