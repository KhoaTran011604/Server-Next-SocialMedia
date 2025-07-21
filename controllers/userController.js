const path = require("path");
const bcrypt = require('bcrypt');
const userModel = require("../models/userModel");
const BaseResponse = require("./BaseResponse");
const fs = require('fs');
const { uploadCloudinaryFn } = require("./orderController");

module.exports.GetAllUser = async (req, res) => {
    const response = new BaseResponse();
    try {
        const { keySearch, page = 1, pageSize = 10, sortField = "createdAt", sortOrder = "desc" } = req.body;

        const filter = {};
        if (keySearch) {
            filter.$or = [{ name: { $regex: keySearch, $options: "i" } }, { email: { $regex: keySearch, $options: "i" } }];
        }

        const sortDirection = sortOrder.toLowerCase() === "asc" ? 1 : -1;
        const sortOptions = { [sortField]: sortDirection };

        const totalRecords = await userModel.countDocuments(filter);
        const data = await userModel
            .find(filter)
            .sort(sortOptions)
            .skip((page - 1) * pageSize)
            .limit(parseInt(pageSize))
            .select("-password -accessToken -refreshToken");

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

module.exports.GetAllUserFK = async (req, res) => {
    const response = new BaseResponse();
    try {
        const data = await userModel.find().sort({ createdAt: -1 }).select("-password");
        response.success = true;
        response.data = data;
        res.json(response);
    } catch (error) {
        response.success = false;
        response.message = error.toString();
        res.status(500).json(response);
    }
};

module.exports.SeachUser = async (req, res) => {
    const response = new BaseResponse();
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ success: false, message: "id is required" });

        const result = await userModel.findById(id).select("-password -accessToken -refreshToken");
        if (!result) return res.status(404).json({ success: false, message: "User not found" });

        response.success = true;
        response.data = result;
        res.json(response);
    } catch (error) {
        response.success = false;
        response.message = error.toString();
        res.status(500).json(response);
    }
};

module.exports.CreateUser = async (req, res) => {
    const response = new BaseResponse();
    try {
        const newUser = req.body;
        const user = await userModel.findOne({ email: newUser.email });

        if (user) {
            response.success = false
            response.message = 'Tài khoản đã tồn tại.'
            return res.json(response);
        } else {
            const hashPassword = bcrypt.hashSync(password, 10);
            newUser.password = hashPassword
            const createUser = await userModel.create(newUser);
            if (!createUser) {
                response.success = false
                response.message = 'An error occurred while creating the account. Please try again.'
                return res.json(response);
            }
            response.success = true;
            response.data = result._id;
            res.json(response);
        }

    } catch (error) {
        response.success = false;
        response.message = error.toString();
        res.status(500).json(response);
    }
};

module.exports.UpdateUser = async (req, res) => {
    const response = new BaseResponse();
    try {
        const { id } = req.params;
        const result = await userModel.findByIdAndUpdate(id, req.body, { new: true });
        if (!result) return res.json({ success: false, message: "User not found" });

        response.success = true;
        response.data = result._id;
        res.json(response);
    } catch (error) {
        response.success = false;
        response.message = error.toString();
        res.status(500).json(response);
    }
};

module.exports.CreateUser_UploadMulti = async (req, res) => {
    const response = new BaseResponse();
    try {

        const { fullName, email, password, phone, address, role, status } = req.body;

        const newData = {
            fullName, email, password, phone, address, role, status, images: []
        }
        const user = await userModel.findOne({ email: email });


        if (user) {
            response.success = false
            response.message = 'Tài khoản đã tồn tại.'
            return res.json(response);
        } else {
            const hashPassword = bcrypt.hashSync(password, 10);

            newData.password = hashPassword
        }
        var imagePaths = []

        // if (req.files && req.files.length > 0) {
        //     imagePaths = req.files.map((file, index) => ({
        //         imageAbsolutePath: `${req.protocol}://${req.get("host")}/uploads/${file.filename}`,
        //         fileName: file.filename,
        //         keyToDelete: path.join(__dirname, "..", file.path),
        //         imageBase64String: "",
        //         imageFile: null,
        //         isNewUpload: false,
        //         displayOrder: index

        //     }));

        // }
        imagePaths = await uploadCloudinaryFn(req.files)

        newData.images = imagePaths;

        //Truy vấn monggo
        const result = await userModel.create(newData);
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

module.exports.UpdateUser_UploadMulti = async (req, res) => {
    const response = new BaseResponse();
    try {
        const { id } = req.params; // Lấy ID từ URL params
        const { fullName, email, password, phone, address, role, status, oldImages = [], deleteImages = [] } = req.body; // Dữ liệu cập nhật
        const dataFindById = await userModel.findById(id);


        var imagePaths = []
        var imagePaths_v2 = []
        var _oldImages = []
        var _deleteImages = []
        var _variants = []
        try {
            _oldImages = JSON.parse(oldImages)
            _oldImages = _oldImages.filter(item => item != null)
        } catch (error) {
            _oldImages = []
        }
        try {
            _deleteImages = JSON.parse(deleteImages)
            _deleteImages = _deleteImages.filter(item => item != null)
        } catch (error) {
            _deleteImages = []
        }
        try {
            _variants = JSON.parse(variants)
            _variants = _variants.filter(item => item != null)
        } catch (error) {
            _variants = []
        }

        var updateData = {
            fullName, email, password, phone, address, role, status
        }

        if (password) {
            const hashPassword = bcrypt.hashSync(password, 10);
            updateData.password = hashPassword
        }

        //Xư lý xóa ảnh deleteImages
        if (_deleteImages.length > 0) {
            _deleteImages.map(image => deleteImageFunction(image.keyToDelete))
        }

        //
        if (req.files && req.files.length > 0) {//Có upload mới
            // imagePaths = req.files.map((file, index) => ({
            //     imageAbsolutePath: `${req.protocol}://${req.get("host")}/uploads/${file.filename}`,
            //     fileName: file.filename,
            //     keyToDelete: path.join(__dirname, "..", file.path),
            //     imageBase64String: "",
            //     imageFile: null,
            //     isNewUpload: false,
            //     displayOrder: index

            // }));
            imagePaths = await uploadCloudinaryFn(req.files)

            imagePaths_v2 = [..._oldImages, ...imagePaths];
        } else {//Không upload ảnh
            // Không xóa ảnh -> ko cần cập nhật lại images
            if (_deleteImages?.length > 0) {//Có xóa ảnh cần lọc lại những ảnh chưa bị xóa để cập nhật

                var filterImages = filterRemainingImages(dataFindById.images, _deleteImages, "imageAbsolutePath")
                //Goi hàm xóa ảnh dựa vào _deleteImages

                imagePaths_v2 = filterImages
            } else {
                imagePaths_v2 = [..._oldImages]
            }
        }

        updateData.images = imagePaths_v2

        const result = await userModel.findByIdAndUpdate(id, updateData, { new: true });

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

module.exports.DeleteUser = async (req, res) => {
    const response = new BaseResponse();
    try {
        const result = await userModel.findByIdAndDelete(req.params.id);
        if (!result) return res.json({ success: false, message: "User not found" });

        response.success = true;
        response.message = "Deleted successfully!";
        res.json(response);
    } catch (error) {
        response.success = false;
        response.message = error.toString();
        res.status(500).json(response);
    }
};


module.exports.UserChangePassword = async (req, res) => {
    const response = new BaseResponse();
    try {
        const { id } = req.params;
        const { password } = req.body

        const hashPassword = bcrypt.hashSync(password, 10);

        const result = await userModel.findByIdAndUpdate(id, { password: hashPassword }, { new: true });
        if (!result) return res.json({ success: false, message: "User not found" });

        response.success = true;
        response.data = result._id;
        res.json(response);
    } catch (error) {
        response.success = false;
        response.message = error.toString();
        res.status(500).json(response);
    }
};

module.exports.UserChangeStatus = async (req, res) => {
    const response = new BaseResponse();
    try {
        const { id } = req.params;


        const result = await userModel.findByIdAndUpdate(id, req.body, { new: true });
        if (!result) return res.json({ success: false, message: "User not found" });

        response.success = true;
        response.data = result._id;
        res.json(response);
    } catch (error) {
        response.success = false;
        response.message = error.toString();
        res.status(500).json(response);
    }
};

function filterRemainingImages(oldImages, deleteImages, key = "id") {
    return oldImages.filter(item => !deleteImages.some(del => del[key] === item[key]));
}

const deleteImageFunction = (relativePath) => {//keyToDelete

    fs.unlink(relativePath, (err) => {
        if (err) {
            return ({
                succsess: false,
                data: null,
                message: "Lỗi xóa ảnh"
            })
        } else {
            return ({
                succsess: true,
                data: null,
                message: "Ảnh đã được xóa thành công!"
            })
        }
    });
};



