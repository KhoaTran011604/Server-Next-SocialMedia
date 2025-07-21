const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    items: [{
        id: String,
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'products' },
        price: Number,
        quantity: Number,
        selectedVariant: {
            id: String,
            color: String,
            size: String
        }
    }],
    totalAmount: Number,
    status: { type: String, enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'], default: 'Pending' },
    shippingAddress: String,
    paymentMethod: String,
    images: {
        type: Array
    },
    description: String,
    paymentStatus: { type: String, enum: ['Unpaid', 'Paid'], default: 'Unpaid' }
}, { timestamps: true });

module.exports = mongoose.model('orders', orderSchema);
