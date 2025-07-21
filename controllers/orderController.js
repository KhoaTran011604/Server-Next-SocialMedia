
const { default: mongoose } = require("mongoose");
const fs = require('fs');
const path = require('path');
const orderModel = require("../models/orderModel");
const BaseResponse = require("./BaseResponse");
const { uploadCloudinaryMultipleImages } = require("./uploadCloudinaryController");
const ObjectId = require('mongoose').Types.ObjectId;


const cloudinary = require("cloudinary").v2;

//const dotenv = require("dotenv");
//dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports.GetAllOrder = async (req, res) => {
    const response = new BaseResponse();
    try {
        const { keySearch, page = 1, pageSize = 10, sortField = "createdAt", sortOrder = "desc" } = req.body;

        const filter = {};
        if (keySearch) {
            filter.$or = [
                { shippingAddress: { $regex: keySearch, $options: "i" } },
                { paymentMethod: { $regex: keySearch, $options: "i" } },
                { status: { $regex: keySearch, $options: "i" } },
            ];
        }

        const sortDirection = sortOrder.toLowerCase() === "asc" ? 1 : -1;
        const sortOptions = { [sortField]: sortDirection };

        const totalRecords = await orderModel.countDocuments(filter);

        const data = await orderModel
            .find(filter)
            .populate({
                path: 'userId',
                select: 'fullName', // chỉ lấy field 'name'
            })
            .populate({
                path: "items.productId",
                select: "name price"
            })
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

module.exports.GetAllOrderFK = async (req, res) => {
    const response = new BaseResponse();
    try {
        const data = await orderModel
            .find()
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

module.exports.SeachOrder = async (req, res) => {
    const response = new BaseResponse();
    try {
        const { id } = req.params;

        if (!id) {
            response.success = false;
            response.message = "id is required";
            return res.status(400).json(response);
        }

        const result = await orderModel.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(id) }
            },
            // JOIN users → lấy userName
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $unwind: { path: "$user", preserveNullAndEmptyArrays: true }
            },
            {
                $addFields: {
                    userName: "$user.fullName"
                }
            },
            // "explode" items để join từng sản phẩm
            {
                $unwind: {
                    path: "$items",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "product"
                }
            },
            {
                $unwind: {
                    path: "$product",
                    preserveNullAndEmptyArrays: true
                }
            },
            // gắn productName, productPrice vào items
            {
                $addFields: {
                    "items.productName": "$product.name",
                    "items.productPrice": "$product.price"
                }
            },
            // gom lại mảng items như ban đầu
            {
                $group: {
                    _id: "$_id",
                    userId: { $first: "$userId" },
                    userName: { $first: "$userName" },
                    totalAmount: { $first: "$totalAmount" },
                    status: { $first: "$status" },
                    shippingAddress: { $first: "$shippingAddress" },
                    paymentMethod: { $first: "$paymentMethod" },
                    description: { $first: "$description" },
                    paymentStatus: { $first: "$paymentStatus" },
                    createdAt: { $first: "$createdAt" },
                    updatedAt: { $first: "$updatedAt" },
                    images: { $first: "$images" },
                    items: { $push: "$items" }
                }
            }
        ]);

        if (!result) {
            response.success = false;
            response.message = "Data not found";
            return res.status(404).json(response);
        }

        response.success = true;
        response.data = result[0];
        res.json(response);
    } catch (error) {
        response.success = false;
        response.message = error.toString();
        res.status(500).json(response);
    }
};

module.exports.CreateOrder = async (req, res) => {
    const response = new BaseResponse();
    try {
        const newOrder = req.body;




        const result = await orderModel.create(newOrder);
        if (!result) {
            response.success = false;
            response.message = "Failed to create order";
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

module.exports.UpdateOrder = async (req, res) => {
    const response = new BaseResponse();
    try {
        const { id } = req.params;
        const updateData = req.body;

        const result = await orderModel.findByIdAndUpdate(id, updateData, { new: true });
        if (!result) {
            response.success = false;
            response.message = "Order not found";
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

module.exports.CreateOrder_UploadMulti = async (req, res) => {
    const response = new BaseResponse();

    try {
        const {
            userId,
            items,
            totalAmount,
            status = "Pending",
            shippingAddress,
            paymentMethod,
            paymentStatus = "Unpaid"
        } = req.body;

        // Parse items từ JSON
        let _items = [];
        try {
            _items = JSON.parse(items).filter(item => item != null);
        } catch (error) {
            _items = [];
        }

        // Chuyển ObjectId
        const _userId = userId ? new mongoose.Types.ObjectId(userId) : null;
        const parsedItems = _items.map(item => ({
            id: item.id,
            productId: item.productId ? new mongoose.Types.ObjectId(item.productId) : null,
            price: item.price,
            quantity: item.quantity,
            selectedVariant: item.selectedVariant || { color: "", size: "" }
        }));

        // Xử lý file upload
        let imagePaths = [];
        if (req.files && req.files.length > 0) {
            // imagePaths = req.files.map((file, index) => ({
            //     imageAbsolutePath: `${req.protocol}://${req.get("host")}/uploads/${file.filename}`,
            //     fileName: file.filename,
            //     keyToDelete: path.join(__dirname, "..", file.path),
            //     imageBase64String: "",
            //     imageFile: null,
            //     isNewUpload: false,
            //     displayOrder: index
            // }));


            // const files = req.files;
            // let uploadResults = [];

            // for (const file of files) {
            //     const result = await cloudinary.uploader.upload(file.path, {
            //         folder: "my_upload",//"uploads", // Thư mục trên Cloudinary
            //         quality: "auto",
            //     });

            //     uploadResults.push(result);
            //     fs.unlinkSync(file.path); // Xóa file sau khi upload
            // }
            // var dataImages = uploadResults?.length > 0 ? uploadResults.map((item, index) => ({
            //     imageAbsolutePath: item.secure_url,
            //     fileName: `${item.original_filename}.${item.format}`,
            //     keyToDelete: item.public_id,
            //     imageBase64String: "",
            //     imageFile: null,
            //     isNewUpload: false,
            //     displayOrder: index
            // })) : []
            imagePaths = await this.uploadCloudinaryFn(req.files)
        }


        const newOrder = {
            userId: _userId,
            items: parsedItems,
            totalAmount,
            status,
            shippingAddress,
            paymentMethod,
            paymentStatus,
            images: imagePaths
        };

        const result = await orderModel.create(newOrder);
        if (!result) {
            response.success = false;
            response.message = "Failed to create order";
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

// module.exports.UpdateOrder_UploadMulti = async (req, res) => {
//     const response = new BaseResponse();

//     try {
//         const { id } = req.params;

//         const {
//             userId,
//             items,
//             totalAmount,
//             status,
//             shippingAddress,
//             paymentMethod,
//             paymentStatus,
//             oldImages = [], deleteImages = []
//         } = req.body;

//         const existingOrder = await orderModel.findById(id);
//         if (!existingOrder) {
//             response.success = false;
//             response.message = "Order not found";
//             return res.status(404).json(response);
//         }

//         // Parse các trường JSON
//         let _items = [], _oldImages = [], _deleteImages = [];
//         try {
//             _items = JSON.parse(items).filter(i => i != null);
//         } catch (error) { }
//         try {
//             _oldImages = JSON.parse(odl_oldImages).filter(i => i != null);
//         } catch (error) { }
//         try {
//             _deleteImages = JSON.parse(deleteImages).filter(i => i != null);
//         } catch (error) { }

//         // Chuyển ObjectId
//         const _userId = userId ? new mongoose.Types.ObjectId(userId) : existingOrder.userId;
//         const parsedItems = _items.map(item => ({
//             productId: item.productId ? new mongoose.Types.ObjectId(item.productId) : null,
//             price: item.price,
//             quantity: item.quantity,
//             selectedVariant: item.selectedVariant || { color: "", size: "" }
//         }));

//         // Xử lý xóa file cũ
//         if (_deleteImages.length > 0) {
//             _deleteImages.forEach(file => {
//                 try {
//                     fs.unlinkSync(file.keyToDelete); // đảm bảo import fs
//                 } catch (error) {
//                     console.warn("Failed to delete file:", file.fileName);
//                 }
//             });
//         }

//         // Xử lý file mới upload
//         let newFiles = [];
//         if (req.files && req.files.length > 0) {
//             newFiles = req.files.map((file, index) => ({
//                 imageAbsolutePath: `${req.protocol}://${req.get("host")}/uploads/${file.filename}`,
//                 fileName: file.filename,
//                 keyToDelete: path.join(__dirname, "..", file.path),
//                 imageBase64String: "",
//                 imageFile: null,
//                 isNewUpload: false,
//                 displayOrder: index
//             }));
//         }

//         // Gộp file cũ + mới
//         const updatedFiles = [..._oldImages, ...newFiles];

//         const updatedOrder = {
//             userId: _userId,
//             items: parsedItems,
//             totalAmount,
//             status,
//             shippingAddress,
//             paymentMethod,
//             paymentStatus,
//             images: updatedFiles
//         };

//         const result = await orderModel.findByIdAndUpdate(id, updatedOrder, { new: true });

//         if (!result) {
//             response.success = false;
//             response.message = "Update failed";
//             return res.json(response);
//         }

//         response.success = true;
//         response.data = result._id;
//         res.json(response);
//     } catch (error) {
//         response.success = false;
//         response.message = error.toString();
//         res.status(500).json(response);
//     }
// };

module.exports.UpdateOrder_UploadMulti = async (req, res) => {
    const response = new BaseResponse();
    try {
        const { id } = req.params; // Lấy ID từ URL params
        const { userId = null, totalAmount, status, shippingAddress, paymentMethod, description, paymentStatus, items = [], oldImages = [], deleteImages = [] } = req.body; // Dữ liệu cập nhật
        const dataFindById = await orderModel.findById(id);


        var imagePaths = []
        var imagePaths_v2 = []
        var _oldImages = []
        var _deleteImages = []
        var _items = []
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
            _items = JSON.parse(items)
            _items = _items.filter(item => item != null)
        } catch (error) {
            _items = []
        }
        const parsedItems = _items.map(item => ({
            id: item.id,
            productId: item.productId ? new mongoose.Types.ObjectId(item.productId) : null,
            price: item.price,
            quantity: item.quantity,
            selectedVariant: item.selectedVariant || { color: "", size: "" }
        }));
        var updateData = {
            userId: userId ? new ObjectId(userId) : null, totalAmount, status, shippingAddress, paymentMethod, description, paymentStatus, items: parsedItems
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

            // const files = req.files;
            // let uploadResults = [];

            // for (const file of files) {
            //     const result = await cloudinary.uploader.upload(file.path, {
            //         folder: "my_upload",//"uploads", // Thư mục trên Cloudinary
            //         quality: "auto",
            //     });

            //     uploadResults.push(result);
            //     fs.unlinkSync(file.path); // Xóa file sau khi upload
            // }
            // var dataImages = uploadResults?.length > 0 ? uploadResults.map((item, index) => ({
            //     imageAbsolutePath: item.secure_url,
            //     fileName: `${item.original_filename}.${item.format}`,
            //     keyToDelete: item.public_id,
            //     imageBase64String: "",
            //     imageFile: null,
            //     isNewUpload: false,
            //     displayOrder: index
            // })) : []
            imagePaths = await this.uploadCloudinaryFn(req.files)


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

        const result = await orderModel.findByIdAndUpdate(id, updateData, { new: true });

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

module.exports.DeleteOrder = async (req, res) => {
    const response = new BaseResponse();
    try {
        const { id } = req.params;

        const result = await orderModel.findByIdAndDelete(id);
        if (!result) {
            response.success = false;
            response.message = "Order not found";
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


module.exports.uploadCloudinaryFn = async (files) => {
    let uploadResults = [];

    for (const file of files) {
        const result = await cloudinary.uploader.upload(file.path, {
            folder: "my_upload",//"uploads", // Thư mục trên Cloudinary
            quality: "auto",
        });

        uploadResults.push(result);
        fs.unlinkSync(file.path); // Xóa file sau khi upload
    }
    var dataImages = uploadResults?.length > 0 ? uploadResults.map((item, index) => ({
        imageAbsolutePath: item.secure_url,
        fileName: `${item.original_filename}.${item.format}`,
        keyToDelete: item.public_id,
        imageBase64String: "",
        imageFile: null,
        isNewUpload: false,
        displayOrder: index
    })) : []
    return dataImages
}


