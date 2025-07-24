
const likeModel = require("../models/likeModel");
const postModel = require("../models/postModel");
const BaseResponse = require("./BaseResponse");


module.exports.toggleLikeDislike = async (req, res) => {
    const response = new BaseResponse();
    try {
        const { userId, postId } = req.body;

        const existing = await likeModel.findOne({ userId, postId });

        if (existing) {
            await existing.deleteOne(); // Nếu đã like → xóa
        } else {
            await likeModel.create({ userId, postId, isLike: true }); // Nếu chưa like → tạo mới
        }
        const result = await postModel.findByIdAndUpdate(postId, { $inc: { likeCount: existing ? -1 : 1 } }, { new: true });
        response.success = true;
        response.message = existing ? "Unliked successfully" : "Liked successfully";
        res.json(response);
    } catch (err) {
        response.success = false;
        response.message = err.message || "Server Error";
        res.status(500).json(response);
    }
};


module.exports.getAllLikesByPost = async (req, res) => {
    const response = new BaseResponse();
    try {
        const { postId } = req.params;
        const likes = await likeModel.find({ postId })
            .populate({
                path: "userId",
                select: "fullName images",
            })
            .sort({ createdAt: -1 });

        response.success = true;
        response.data = likes;
        res.json(response);
    } catch (err) {
        response.success = false
        response.message = err;
        res.status(500).json(response);
    }
};

module.exports.CreateLike = async (req, res) => {
    const response = new BaseResponse();
    try {
        const newLike = req.body;


        const result = await likeModel.create(newLike);
        if (!result) {
            response.success = false;
            response.message = "Failed to create like";
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

