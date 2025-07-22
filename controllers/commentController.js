
const commentModel = require("../models/commentModel")
const BaseResponse = require("./BaseResponse")

module.exports.createComment = async (req, res) => {
    const response = new BaseResponse();
    try {
        const { userId, postId, content, parentId = null } = req.body;

        const comment = await commentModel.create({
            userId,
            postId,
            content,
            parentId,
        });

        response.success = true;
        response.data = comment;
        res.json(response);
    } catch (err) {
        response.success = false
        response.message = err
        res.status(500).json(response);
    }
};

module.exports.deleteComment = async (req, res) => {
    const response = new BaseResponse();
    try {
        const { id } = req.params;

        // Remove comment and its direct replies
        await commentModel.deleteMany({
            $or: [{ _id: id }, { parentId: id }],
        });

        response.success = true;
        response.message = "Comment and its replies deleted";
        res.json(response);
    } catch (err) {
        response.success = false
        response.message = err
        res.status(500).json(response);
    }
};

module.exports.getAllCommentsByPost = async (req, res) => {
    const response = new BaseResponse();
    try {
        const { postId } = req.params;

        const comments = await commentModel.find({ postId })
            .populate({
                path: "userId",
                select: "fullName images",
            })
            .populate("parentId")
            .sort({ createdAt: -1 });

        response.success = true;
        response.data = comments;
        res.json(response);
    } catch (err) {
        response.success = false
        response.message = err
        res.status(500).json(response);
    }
};