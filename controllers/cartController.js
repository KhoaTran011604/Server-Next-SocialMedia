const cartModel = require("../models/cartModel");
const BaseResponse = require("./BaseResponse");

module.exports.GetAllCart = async (req, res) => {
    const response = new BaseResponse();
    try {
        const { keySearch, page = 1, pageSize = 10, sortField = "createdAt", sortOrder = "desc" } = req.body;

        const filter = {};
        if (keySearch) {
            // Optional: tìm theo userId (chuyển thành string để tìm)
            filter.$or = [
                { userId: { $regex: keySearch, $options: "i" } }
            ];
        }

        const sortDirection = sortOrder.toLowerCase() === "asc" ? 1 : -1;
        const sortOptions = { [sortField]: sortDirection };

        const totalRecords = await cartModel.countDocuments(filter);

        const data = await cartModel
            .find(filter)
            .populate("userId")
            .populate("items.productId")
            .sort(sortOptions)
            .skip((page - 1) * pageSize)
            .limit(parseInt(pageSize));

        response.success = true;
        response.data = data;
        response.metaData = {
            totalRecords,
            totalPages: Math.ceil(totalRecords / pageSize),
            currentPage: parseInt(page),
            pageSize: parseInt(pageSize),
        };

        res.json(response);
    } catch (error) {
        response.success = false;
        response.message = error.toString();
        res.status(500).json(response);
    }
};

module.exports.GetAllCartFK = async (req, res) => {
    const response = new BaseResponse();
    try {
        const data = await cartModel.find()
            .populate("userId")
            .populate("items.productId")
            .sort({ createdAt: -1 });

        response.success = true;
        response.data = data;

        res.json(response);
    } catch (error) {
        response.success = false;
        response.message = error.toString();
        res.status(500).json(response);
    }
};

module.exports.SeachCart = async (req, res) => {
    const response = new BaseResponse();
    try {
        const { id } = req.params;

        if (!id) {
            response.success = false;
            response.message = "id is required";
            return res.status(400).json(response);
        }

        const result = await cartModel.findById(id)
            .populate("userId")
            .populate("items.productId");

        if (!result) {
            response.success = false;
            response.message = "Data not found";
            return res.status(404).json(response);
        }

        response.success = true;
        response.data = result;
        res.json(response);
    } catch (error) {
        response.success = false;
        response.message = error.toString();
        res.status(500).json(response);
    }
};

module.exports.CreateCart = async (req, res) => {
    const response = new BaseResponse();
    try {
        const newCart = req.body;

        const result = await cartModel.create(newCart);
        if (!result) {
            response.success = false;
            response.message = "Failed to create cart";
            return res.json(response);
        }

        response.success = true;
        response.data = result._id;
        res.json(response);
    } catch (error) {
        response.success = false;
        response.message = error.toString();
        res.status(500).json(response);
    }
};

module.exports.UpdateCart = async (req, res) => {
    const response = new BaseResponse();
    try {
        const { id } = req.params;
        const updateData = req.body;

        const result = await cartModel.findByIdAndUpdate(id, updateData, { new: true });
        if (!result) {
            response.success = false;
            response.message = "Cart not found";
            return res.json(response);
        }

        response.success = true;
        response.data = result._id;
        res.json(response);
    } catch (error) {
        response.success = false;
        response.message = error.toString();
        res.status(500).json(response);
    }
};

module.exports.DeleteCart = async (req, res) => {
    const response = new BaseResponse();
    try {
        const { id } = req.params;

        const result = await cartModel.findByIdAndDelete(id);
        if (!result) {
            response.success = false;
            response.message = "Cart not found";
            return res.json(response);
        }

        response.success = true;
        response.message = "Deleted successfully!";
        res.json(response);
    } catch (error) {
        response.success = false;
        response.message = error.toString();
        res.status(500).json(response);
    }
};
