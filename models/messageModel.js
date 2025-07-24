const mongoose = require('mongoose');

const _Schema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    text: {
        type: String,
    },
    image: {
        type: String,
    },
}, { timestamps: true });

module.exports = mongoose.model('messages', _Schema);
