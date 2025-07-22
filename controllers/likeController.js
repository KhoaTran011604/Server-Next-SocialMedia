
const likeModel = require("../models/likeModel");
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
