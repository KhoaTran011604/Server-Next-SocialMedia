
const todoModel = require("../models/todoModel");
const BaseResponse = require('./BaseResponse');


module.exports.TestTodo = async (req, res) => {
    const response = new BaseResponse();
    try {
        // Truy vấn dữ liệu có phân trang và sắp xếp
        const data = await todoModel.find({});
        // Trả về kết quả cho frontend
        response.success = true;
        response.data = data;
        response.metaData = {
            totalRecords: 0,
            totalPages: 0,
            currentPage: parseInt(1),
            pageSize: parseInt(1),
        };

        res.json(response);
    } catch (error) {
        response.success = false;
        response.message = error.toString();
        res.status(500).json(response);
    }
};

module.exports.GetAllTodo = async (req, res) => {
    const response = new BaseResponse();
    try {
        const { keySearch, page = 1, pageSize = 10, sortField = "createdAt", sortOrder = "desc" } = req.body;


        const filter = {};
        if (keySearch) {
            filter.$or = [
                { title: { $regex: keySearch, $options: "i" } },
                { description: { $regex: keySearch, $options: "i" } },
            ];
        }

        // Xác định hướng sắp xếp (1: tăng dần, -1: giảm dần)
        const sortDirection = sortOrder.toLowerCase() === "asc" ? 1 : -1;
        const sortOptions = { [sortField]: sortDirection };

        // Lấy tổng số bản ghi thỏa mãn điều kiện
        const totalRecords = await todoModel.countDocuments(filter);

        // Truy vấn dữ liệu có phân trang và sắp xếp
        const data = await todoModel
            .find(filter)
            .sort(sortOptions) // Áp dụng sắp xếp
            .skip((page - 1) * pageSize)
            .limit(parseInt(pageSize));

        // Trả về kết quả cho frontend
        response.success = true;
        response.data = data;
        response.metaData = {
            totalRecords: totalRecords,
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


module.exports.GetCompletedTodo = async (req, res) => {
    const response = new BaseResponse();
    try {
        const { keySearch, page = 1, pageSize = 10, sortField = "createdAt", sortOrder = "desc" } = req.body;


        const filter = {};
        if (keySearch) {
            filter.$or = [
                { title: { $regex: keySearch, $options: "i" } },
                { description: { $regex: keySearch, $options: "i" } },
            ];
        }

        // Xác định hướng sắp xếp (1: tăng dần, -1: giảm dần)
        const sortDirection = sortOrder.toLowerCase() === "asc" ? 1 : -1;
        const sortOptions = { [sortField]: sortDirection };

        // Lấy tổng số bản ghi thỏa mãn điều kiện
        const totalRecords = await todoModel.countDocuments(filter);

        // Truy vấn dữ liệu có phân trang và sắp xếp
        const data = await todoModel
            .find(filter)
            .where("completed").equals(true)
            .sort(sortOptions) // Áp dụng sắp xếp
            .skip((page - 1) * pageSize)
            .limit(parseInt(pageSize));

        // Trả về kết quả cho frontend
        response.success = true;
        response.data = data;
        response.metaData = {
            totalRecords: totalRecords,
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

module.exports.GetAllTodoFK = async (req, res) => {
    const response = new BaseResponse();
    try {
        const sortField = "createdAt";
        const sortOrder = "desc"

        // Xác định hướng sắp xếp (1: tăng dần, -1: giảm dần)
        const sortDirection = sortOrder.toLowerCase() === "asc" ? 1 : -1;
        const sortOptions = { [sortField]: sortDirection };


        // Truy vấn dữ liệu có phân trang và sắp xếp
        const data = await todoModel
            .sort(sortOptions); // Áp dụng sắp xếp


        // Trả về kết quả cho frontend
        response.success = true;
        response.data = data;

        res.json(response);
    } catch (error) {
        response.success = false;
        response.message = error.toString();
        res.status(500).json(response);
    }
};


module.exports.SeachTodo = async (req, res) => {
    let response = new BaseResponse();
    try {
        const { id } = req.params; // Lấy ID từ URL params

        if (!id) {
            response.success = false;
            response.message = "id is required";
            return res.status(400).json(response);
        }

        const result = await todoModel.findById(id); // Tìm kiếm theo ID trong MongoDB

        if (!result) {
            response.success = false;
            response.message = "Data not found";
            return res.status(404).json(response);
        }

        response.data = result;
        response.message = "Form found successfully";
        res.json(response);
    } catch (error) {
        response.success = false;
        response.message = error.toString();
        response.data = null;
        res.status(500).json(response);
    }
};


module.exports.CreateTodo = async (req, res) => {
    const response = new BaseResponse();
    try {

        const newData = req.body;
        //Truy vấn monggo
        const result = await todoModel.create(newData);
        if (!result) {
            response.success = false
            response.message = 'An error occurred during the execution, please try again.'
            return res.json(response);
        }
        response.success = true
        response.data = result?._id
        res.json(response);
    } catch (error) {
        response.success = false
        response.message = error.toString()
        res.status(500).json(response);
    }
};

module.exports.UpdateTodo = async (req, res) => {
    const response = new BaseResponse();
    try {
        const { id } = req.params; // Lấy ID từ URL params
        const updateData = req.body; // Dữ liệu cập nhật

        const result = await todoModel.findByIdAndUpdate(id, updateData, { new: true });

        if (!result) {
            response.success = false;
            response.message = "No data found to update..";
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

module.exports.CompletedTodo = async (req, res) => {
    const response = new BaseResponse();
    try {
        const { id } = req.params; // Lấy ID từ URL params
        const updateData = { completed: true }; // Dữ liệu cập nhật

        const result = await todoModel.findByIdAndUpdate(id, updateData, { new: true });

        if (!result) {
            response.success = false;
            response.message = "No data found to update..";
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

module.exports.DeleteTodo = async (req, res) => {
    const response = new BaseResponse();
    try {
        const { id } = req.params; // Lấy ID từ URL params

        const result = await todoModel.findByIdAndDelete(id);

        if (!result) {
            response.success = false;
            response.message = "No data found to delete.";
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

module.exports.GetAllTodo_WithoutPanigation = async (req, res) => {
    const response = new BaseResponse();
    try {
        const { keySearch, page = 1, pageSize = 10, sortField = "createdAt", sortOrder = "desc" } = req.body;


        const filter = {};
        if (keySearch) {
            filter.$or = [
                { title: { $regex: keySearch, $options: "i" } },
                { description: { $regex: keySearch, $options: "i" } },
            ];
        }

        const sortDirection = sortOrder.toLowerCase() === "asc" ? 1 : -1;
        const sortOptions = { [sortField]: sortDirection };
        // Lấy tổng số bản ghi thỏa mãn điều kiện
        const totalRecords = await todoModel.countDocuments(filter);

        // Truy vấn dữ liệu có phân trang và sắp xếp
        const data = await todoModel
            .find(filter)
            .sort(sortOptions) // Áp dụng sắp xếp

        // Trả về kết quả cho frontend
        response.success = true;
        response.data = data;
        response.metaData = {
            totalRecords: totalRecords,
            totalPages: parseInt(0),
            currentPage: parseInt(1),
            pageSize: parseInt(9999),
        };

        res.json(response);
    } catch (error) {
        response.success = false;
        response.message = error.toString();
        res.status(500).json(response);
    }
};

module.exports.GetCompletedTodo_WithoutPanigation = async (req, res) => {
    const response = new BaseResponse();
    try {
        const { keySearch, page = 1, pageSize = 10, sortField = "createdAt", sortOrder = "desc" } = req.body;


        const filter = {};
        if (keySearch) {
            filter.$or = [
                { title: { $regex: keySearch, $options: "i" } },
                { description: { $regex: keySearch, $options: "i" } },
            ];
        }

        // Lấy tổng số bản ghi thỏa mãn điều kiện
        const totalRecords = await todoModel.countDocuments(filter);

        const sortDirection = sortOrder.toLowerCase() === "asc" ? 1 : -1;
        const sortOptions = { [sortField]: sortDirection };

        // Truy vấn dữ liệu có phân trang và sắp xếp
        const data = await todoModel
            .find(filter)
            .where("completed").equals(true)
            .sort(sortOptions) // Áp dụng sắp xếp

        // Trả về kết quả cho frontend
        response.success = true;
        response.data = data;
        response.metaData = {
            totalRecords: totalRecords,
            totalPages: parseInt(0),
            currentPage: parseInt(1),
            pageSize: parseInt(9999),
        };

        res.json(response);
    } catch (error) {
        response.success = false;
        response.message = error.toString();
        res.status(500).json(response);
    }
};












