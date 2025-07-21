const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        //required:true
    },
    password: {
        type: String,
    },
    email: {
        type: String,
    },
    phone: {
        type: String,
    },
    address: {
        type: Object,
    },
    avatar: {
        type: Object,
    },
    role: { type: String, enum: ['User', 'Admin'], default: 'User' },
    status: { type: String, enum: ['Active', 'UnActive'], default: 'Active' },
    images: { type: Array, default: [] },
    accessToken: {
        type: String,
    },
    refreshToken: {
        type: String,
    }
}, { timestamps: true })

module.exports = mongoose.model("users", userSchema)