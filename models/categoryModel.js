const mongoose = require('mongoose')

const _Schema = new mongoose.Schema({
    name: {
        type: String,
    },
}, { timestamps: true }
)

module.exports = mongoose.model("categories", _Schema)