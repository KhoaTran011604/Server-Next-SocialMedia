
const likeModel = require("../models/likeModel");
const BaseResponse = require("./BaseResponse");



module.exports.toggleLikeDislike = async (req, res) => {

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
