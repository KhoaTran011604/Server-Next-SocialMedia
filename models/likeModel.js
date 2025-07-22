const mongoose = require('mongoose')

const _Schema = new mongoose.Schema({
    userId: { type: mongoose.Types.ObjectId, ref: "users", required: true },
    postId: { type: mongoose.Types.ObjectId, ref: "post", required: true },
    isLike: { type: Boolean, default: true }, // true = like, false = dislike
}, { timestamps: true }
)

module.exports = mongoose.model("likes", _Schema)