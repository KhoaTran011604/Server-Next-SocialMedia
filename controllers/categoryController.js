
const categoryModel = require("../models/categoryModel");
const BaseResponse = require('./BaseResponse');


module.exports.GetAllCategory = async (req, res) => {
  const response = new BaseResponse();
  try {
    const { keySearch, page = 1, pageSize = 10, sortField = "createdAt", sortOrder = "desc" } = req.body;


    const filter = {};
    if (keySearch) {
      filter.$or = [
        { name: { $regex: keySearch, $options: "i" } },
        { description: { $regex: keySearch, $options: "i" } },
      ];
    }

    // Xác định hướng sắp xếp (1: tăng dần, -1: giảm dần)
    const sortDirection = sortOrder.toLowerCase() === "asc" ? 1 : -1;
    const sortOptions = { [sortField]: sortDirection };

    // Lấy tổng số bản ghi thỏa mãn điều kiện
    const totalRecords = await categoryModel.countDocuments(filter);

    // Truy vấn dữ liệu có phân trang và sắp xếp
    const data = await categoryModel
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

module.exports.GetAllCategoryFK = async (req, res) => {
  const response = new BaseResponse();
  try {
    const sortField = "createdAt";
    const sortOrder = "desc"

    // Xác định hướng sắp xếp (1: tăng dần, -1: giảm dần)
    const sortDirection = sortOrder.toLowerCase() === "asc" ? 1 : -1;
    const sortOptions = { [sortField]: sortDirection };


    // Truy vấn dữ liệu có phân trang và sắp xếp
    const data = await categoryModel
      .find()
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


module.exports.SeachCategory = async (req, res) => {
  let response = new BaseResponse();
  try {
    const { id } = req.params; // Lấy ID từ URL params

    if (!id) {
      response.success = false;
      response.message = "id is required";
      return res.status(400).json(response);
    }

    const result = await categoryModel.findById(id); // Tìm kiếm theo ID trong MongoDB

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


module.exports.CreateCategory = async (req, res) => {
  const response = new BaseResponse();
  try {

    const newData = req.body;
    //Truy vấn monggo
    const result = await categoryModel.create(newData);
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

module.exports.UpdateCategory = async (req, res) => {
  const response = new BaseResponse();
  try {
    const { id } = req.params; // Lấy ID từ URL params
    const updateData = req.body; // Dữ liệu cập nhật

    const result = await categoryModel.findByIdAndUpdate(id, updateData, { new: true });

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

module.exports.DeleteCategory = async (req, res) => {
  const response = new BaseResponse();
  try {
    const { id } = req.params; // Lấy ID từ URL params

    const result = await categoryModel.findByIdAndDelete(id);

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













