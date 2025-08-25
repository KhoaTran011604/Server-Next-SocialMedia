
const { default: mongoose } = require("mongoose");
const fs = require('fs');
const path = require('path');
const postModel = require("../models/postModel");
const BaseResponse = require("./BaseResponse");
const { uploadCloudinaryMultipleImages, deleteImage } = require("./uploadCloudinaryController");
const likeModel = require("../models/likeModel");
const ObjectId = require('mongoose').Types.ObjectId;


const cloudinary = require("cloudinary").v2;

//const dotenv = require("dotenv");
//dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports.GetAllPost = async (req, res) => {
    const response = new BaseResponse();
    try {
        const { keySearch, page = 1, pageSize = 10, userId, sortField = "createdAt", sortPost = "desc" } = req.body;

        const filter = {};

        // Nếu có userId thì chỉ lấy bài viết của user đó
        if (userId) {
            filter.userId = userId;
        }

        if (keySearch) {
            filter.$or = [
                { content: { $regex: keySearch, $options: "i" } },
                { hashTags: { $regex: keySearch, $options: "i" } },
                { status: { $regex: keySearch, $options: "i" } },
            ];
        }

        const sortDirection = sortPost.toLowerCase() === "asc" ? 1 : -1;
        const sortOptions = { [sortField]: sortDirection };

        const totalRecords = await postModel.countDocuments(filter);

        const data = await postModel
            .find(filter)
            .populate({
                path: 'userId',
                select: 'fullName images', // chỉ lấy field 'name'
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

module.exports.GetAllPostFK = async (req, res) => {
    const response = new BaseResponse();
    try {
        const data = await postModel
            .find()
            .populate("userId")
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

module.exports.SeachPost = async (req, res) => {
    const response = new BaseResponse();
    try {
        const { id } = req.params;

        if (!id) {
            response.success = false;
            response.message = "id is required";
            return res.status(400).json(response);
        }

        const result = await postModel.aggregate([
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
                    userName: "$user.fullName",
                    userImages: "$user.images"
                }
            },
            // gom lại mảng likes như ban đầu
            {
                $group: {
                    _id: "$_id",
                    userId: { $first: "$userId" },
                    userName: { $first: "$userName" },
                    userImages: { $first: "$userImages" },
                    status: { $first: "$status" },
                    images: { $first: "$images" },
                    content: { $first: "$content" },
                    hashTags: { $first: "$hashTags" },
                    comments: { $first: "$comments" },
                    likes: { $first: "$likes" },
                    createdAt: { $first: "$createdAt" },
                    updatedAt: { $first: "$createdAt" },
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

module.exports.CreatePost = async (req, res) => {
    const response = new BaseResponse();
    try {
        const newPost = req.body;




        const result = await postModel.create(newPost);
        if (!result) {
            response.success = false;
            response.message = "Failed to create post";
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

module.exports.UpdatePost = async (req, res) => {
    const response = new BaseResponse();
    try {
        const { id } = req.params;
        const updateData = req.body;

        const result = await postModel.findByIdAndUpdate(id, updateData, { new: true });
        if (!result) {
            response.success = false;
            response.message = "Post not found";
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

module.exports.CreatePost_UploadMulti = async (req, res) => {
    const response = new BaseResponse();

    try {
        const {
            userId,
            content,
            hashTags,
            likes,
            status,
            comments
        } = req.body;

        // Parse items từ JSON
        let _likes = [];
        try {
            _likes = JSON.parse(likes).filter(item => item != null);
        } catch (error) {
            _likes = [];
        }

        let _comments = [];
        try {
            _comments = JSON.parse(comments).filter(item => item != null);
        } catch (error) {
            _comments = [];
        }

        let _hashTags = [];
        try {
            _hashTags = JSON.parse(hashTags).filter(item => item != null);
        } catch (error) {
            _hashTags = [];
        }

        // Chuyển ObjectId
        const _userId = userId ? new mongoose.Types.ObjectId(userId) : null;


        // Xử lý file upload
        let imagePaths = [];
        if (req.files && req.files.length > 0) {

            imagePaths = await this.uploadCloudinaryFn(req.files)
        }


        const newPost = {
            userId: _userId,
            content,
            hashTags: _hashTags,
            comments: _comments,
            likes: _likes,
            status,
            images: imagePaths
        };

        const result = await postModel.create(newPost);
        if (!result) {
            response.success = false;
            response.message = "Failed to create post";
            return res.json(response);
        }
        const result_v2 = await postModel.findById(result._id)
            .populate({
                path: 'userId',
                select: 'fullName images',
            });
        response.success = true;
        response.data = result_v2;//result._id;
        res.json(response);
    } catch (error) {
        response.success = false;
        response.message = error.toString();
        res.status(500).json(response);
    }
};



module.exports.UpdatePost_UploadMulti = async (req, res) => {
    const response = new BaseResponse();
    try {
        const { id } = req.params; // Lấy ID từ URL params
        const { userId = null, content, status, hashTags = [], likes = [], comments = [], items = [], oldImages = [], deleteImages = [] } = req.body; // Dữ liệu cập nhật
        const dataFindById = await postModel.findById(id);


        var imagePaths = []
        var imagePaths_v2 = []
        var _oldImages = []
        var _deleteImages = []
        let _likes = [];
        let _comments = [];
        let _hashTags = [];

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
            _likes = JSON.parse(likes).filter(item => item != null);
        } catch (error) {
            _likes = [];
        }


        try {
            _comments = JSON.parse(comments).filter(item => item != null);
        } catch (error) {
            _comments = [];
        }


        try {
            _hashTags = JSON.parse(hashTags).filter(item => item != null);
        } catch (error) {
            _hashTags = [];
        }

        var updateData = {
            userId: userId ? new ObjectId(userId) : null, content,
            hashTags: _hashTags,
            comments: _comments,
            likes: _likes,
            status,
        }

        //Xư lý xóa ảnh deleteImages
        if (_deleteImages.length > 0) {
            _deleteImages.map(image => deleteImage(image.keyToDelete))
        }

        //
        if (req.files && req.files.length > 0) {//Có upload mới

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

        const result = await postModel.findByIdAndUpdate(id, updateData, { new: true });

        if (!result) {
            response.success = false;
            response.message = "No data found to update..";
            return res.json(response);
        }

        response.success = true;
        response.data = result;//result._id;
        res.json(response);
    } catch (error) {
        response.success = false;
        response.message = error.toString();
        res.status(500).json(response);
    }
};

module.exports.DeletePost = async (req, res) => {
    const response = new BaseResponse();
    try {
        const { id } = req.params;
        // 1. Search post để lấy ảnh
        const post = await postModel.findById(id);
        if (!post) {
            response.success = false;
            response.message = "Post not found";
            return res.json(response);
        }

        // 2. Xóa ảnh Cloudinary nếu có
        if (post.images && post.images.length > 0) {
            // Sử dụng Promise.all để chờ tất cả ảnh xóa xong
            await Promise.all(
                post.images.map(img => deleteImage(img.keyToDelete))
            );
        }

        const result = await postModel.findByIdAndDelete(id);
        if (!result) {
            response.success = false;
            response.message = "Post not found";
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
    var result = null
    for (const file of files) {
        if (file.mimetype !== 'video/mp4') {
            result = await cloudinary.uploader.upload(file.path, {
                folder: "my_upload",//"uploads", // Thư mục trên Cloudinary
                quality: "auto",
            });
            result.isVideo = false
        } else {
            result = await uploadLargeAsync(file.path, {
                folder: "my_upload",
                quality: "auto",
                resource_type: "video",
                chunk_size: 6000000,
            });
            result.isVideo = true;
        }


        if (result)
            uploadResults.push(result);
        fs.unlinkSync(file.path);
    }

    var dataImages = uploadResults?.length > 0 ? uploadResults.map((item, index) => ({
        imageAbsolutePath: item.secure_url,
        fileName: `${item.original_filename}.${item.format}`,
        keyToDelete: item.public_id,
        imageBase64String: "",
        imageFile: null,
        isNewUpload: false,
        displayPost: index,
        isVideo: item.isVideo
    })) : []
    return dataImages
}

const uploadLargeAsync = (filePath, options) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_large(filePath, options, (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
    });
};




module.exports.GetAllPostByUserId = async (req, res) => {
    const response = new BaseResponse();
    try {
        const {
            keySearch,
            page = 1,
            pageSize = 10,
            userId,        // bài viết của user nào

            sortField = "createdAt",
            sortPost = "desc",
        } = req.body;
        const viewerId = req.user.id
        const filter = {};
        if (userId) filter.userId = userId;

        if (keySearch) {
            filter.$or = [
                { content: { $regex: keySearch, $options: "i" } },
                { hashTags: { $regex: keySearch, $options: "i" } },
                { status: { $regex: keySearch, $options: "i" } },
            ];
        }

        const sortDirection = sortPost.toLowerCase() === "asc" ? 1 : -1;
        const sortOptions = { [sortField]: sortDirection };

        const totalRecords = await postModel.countDocuments(filter);

        const posts = await postModel
            .find(filter)
            .populate({
                path: 'userId',
                select: 'fullName images',
            })
            .sort(sortOptions)
            .skip((page - 1) * pageSize)
            .limit(parseInt(pageSize))
            .lean(); // chuyển về object JS thuần

        let postIds = posts.map(post => post._id);

        // Lấy tất cả likes của viewerId với các post đang được lấy
        const likedPosts = await likeModel.find({
            userId: viewerId,
            postId: { $in: postIds },
            isLike: true,
        }).select("postId").lean();

        const likedPostIds = new Set(likedPosts.map(item => item.postId.toString()));

        // Gắn isLike = true/false cho từng post
        const postsWithLike = posts.map(post => ({
            ...post,
            isLike: likedPostIds.has(post._id.toString()),
        }));

        response.success = true;
        response.data = postsWithLike;
        response.metaData = {
            totalRecords,
            totalPages: Math.ceil(totalRecords / pageSize),
            currentPage: parseInt(page),
            pageSize: parseInt(pageSize),
        };

        res.json(response);
    } catch (error) {
        console.error(error);
        response.success = false;
        response.message = error.toString();
        res.status(500).json(response);
    }
};