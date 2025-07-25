const mongoose = require('mongoose');

const _Schema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    friendId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },

}, { timestamps: true });

module.exports = mongoose.model('friends', _Schema);
