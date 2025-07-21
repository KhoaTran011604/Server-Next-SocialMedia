const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'products' },
        quantity: Number,
        selectedVariant: {
            color: String,
            size: String
        }
    }]
}, { timestamps: true });

module.exports = mongoose.model('carts', cartSchema);
