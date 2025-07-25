
//import cloudinary from "../lib/cloudinary.js";
//import { getReceiverSocketId, io } from "../server.js";

const cloudinary = require("../lib/cloudinary")
const ServerLib = require("../lib/socket")
const { getReceiverSocketId, io } = ServerLib
const { uploadCloudinaryFn } = require("./orderController");
const messageModel = require("../models/messageModel");
const userModel = require("../models/userModel");
const BaseResponse = require('./BaseResponse');

// GET USERS
module.exports.getUsersForSidebar = async (req, res) => {
    const response = new BaseResponse();
    try {
        const loggedInUserId = req.user.id;


        const filteredUsers = await userModel.find({ _id: { $ne: loggedInUserId } }).select("-password");

        response.data = filteredUsers;
        response.message = "Get users successfully";
        response.metaData.totalRecords = filteredUsers.length;

        res.status(200).json(response);
    } catch (error) {
        console.error("Error in getUsersForSidebar: ", error.message);
        response.success = false;
        response.message = "Internal server error";
        res.status(500).json(response);
    }
};

// GET MESSAGES
module.exports.getMessages = async (req, res) => {
    const response = new BaseResponse();
    try {
        const { userToChatId } = req.params;
        const myId = req.user.id;
        const messages = await messageModel.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId },
            ],
        }).sort({ createdAt: 1 }); // optional: sort messages chronologically

        response.data = messages;
        response.message = "Get messages successfully";
        response.metaData.totalRecords = messages.length;

        res.status(200).json(response);
    } catch (error) {
        console.error("Error in getMessages: ", error.message);
        response.success = false;
        response.message = "Internal server error";
        res.status(500).json(response);
    }
};

// SEND MESSAGE
module.exports.sendMessage = async (req, res) => {
    const response = new BaseResponse();
    try {
        const { text, image } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user.id

        const senderUser = await userModel.findById(senderId).select("fullName");

        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }



        const newMessage = new messageModel({
            senderId,
            receiverId,
            text,
            image: imageUrl,

        });


        await newMessage.save();
        const justNow = new Date().toISOString();
        const customNewMessage = {
            senderId,
            receiverId,
            text,
            image: imageUrl,
            senderName: senderUser.fullName,
            createdAt: justNow,
            updatedAt: justNow
        }
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", customNewMessage);
        }

        response.data = newMessage;
        response.message = "Message sent successfully";

        res.status(201).json(response);
    } catch (error) {
        console.error("Error in sendMessage: ", error.message);
        response.success = false;
        response.message = "Internal server error";
        res.status(500).json(response);
    }
};


module.exports.sendMessageWithImage = async (req, res) => {
    const response = new BaseResponse();
    try {
        const { text, image } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user.id

        const senderUser = await userModel.findById(senderId).select("fullName");

        // let imageUrl;
        // if (image) {
        //     const uploadResponse = await cloudinary.uploader.upload(image);
        //     imageUrl = uploadResponse.secure_url;
        // }
        let imageUrl;
        const imagePaths = await uploadCloudinaryFn(req.files)
        if (imagePaths && imagePaths.length > 0) {
            imageUrl = imagePaths[0].imageAbsolutePath
        }

        const newMessage = new messageModel({
            senderId,
            receiverId,
            text,
            image: imageUrl,
        });

        await newMessage.save();
        const justNow = new Date().toISOString();
        const customNewMessage = {
            senderId,
            receiverId,
            text,
            image: imageUrl,
            senderName: senderUser.fullName,
            createdAt: justNow,
            updatedAt: justNow
        }
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", customNewMessage);
        }

        response.data = newMessage;
        response.message = "Message sent successfully";

        res.status(201).json(response);
    } catch (error) {
        console.error("Error in sendMessage: ", error.message);
        response.success = false;
        response.message = "Internal server error";
        res.status(500).json(response);
    }
};
