// import BaseResponse from "../controllers/BaseResponse";
// const jwt = require("jsonwebtoken");
// const bcrypt = require('bcrypt');



// module.exports.AuthVertify = (req, res, next) => {
//     let response = new BaseResponse();
//     const authHeader = req.headers.authorization;
//     const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer <token>
//     console.log("token", token);

//     if (!token) return res.status(401).json({ ...response, message: "No token provided" });

//     jwt.verify(token, accessTokenSecret, (err, decoded) => {
//         if (err) return res.status(403).json({ ...response, message: "Invalid token" });
//         console.log("token", decoded);
//         req.user = decoded;
//         next();
//     });
// };

