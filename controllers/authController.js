const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');
const userModel = require("../models/userModel"); // Giả sử bạn có model User
const dotenv = require("dotenv");
const BaseResponse = require("./BaseResponse");
const path = require('path');
dotenv.config();

const accessTokenLife = process.env.ACCESS_TOKEN_LIFE;
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const refreshTokenLife = process.env.REFRESH_TOKEN_LIFE;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

const GenerateTokens = (user) => {

  const accessToken = jwt.sign(
    { id: user._id, email: user.email, fullName: user.fullName, profilePic: user?.images?.length > 0 ? user?.images[0]?.imageAbsolutePath : "" },
    accessTokenSecret,
    { expiresIn: accessTokenLife }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    refreshTokenSecret,
    { expiresIn: refreshTokenLife }
  );

  return { accessToken, refreshToken };
};

module.exports.SignUp = async (req, res) => {
  const response = new BaseResponse();
  try {
    const { email, password, fullName } = req.body;

    const user = await userModel.findOne({ email: email });

    if (user) {
      response.success = false
      response.message = 'Tài khoản đã tồn tại.'
      return res.json(response);
    }
    else {
      const hashPassword = bcrypt.hashSync(password, 10);
      const newUser = {
        email,
        password: hashPassword,
        fullName
      };
      const createUser = await userModel.create(newUser);
      if (!createUser) {
        response.success = false
        response.message = 'An error occurred while creating the account. Please try again.'
        return res.json(response);
      }
      response.success = true
      response.data = createUser?._id
      res.json(response);
    }
  } catch (error) {
    response.success = false
    response.message = error.toString()
    res.status(500).json(response);
  }

};


exports.Login = async (req, res) => {
  const response = new BaseResponse()
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      response.success = false
      response.message = "Invalid email or password"
      return res.status(401).json(response);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      response.success = false
      response.message = "Invalid email or password"
      return res.status(401).json(response);
    }

    const { accessToken, refreshToken } = GenerateTokens(user);
    const updatedUser = await userModel.updateOne(
      { email: user.email },
      { $set: { refreshToken: refreshToken, accessToken: accessToken } }
    );

    response.success = true
    response.message = 'Đăng nhập thành công.'
    response.data = {
      accessToken,
      refreshToken,
      //user//
    }
    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: false, // ✅ Bật true nếu dùng HTTPS
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000, // 1 giờ
    });
    res.json(response);
  } catch (error) {
    response.success = false
    response.message = error.toString()
    res.status(500).json(response);
  }
};

module.exports.ChangePassword = async (req, res) => {
  const response = new BaseResponse;
  try {

    const { usename, password } = req.body;
    //Truy vấn monggo


    // Trả về kết quả cho frontend
    res.json({ response });
  } catch (error) {
    response = {
      ...response,
      success: false,
      message: error.toString(),
      data: null
    }
    res.status(500).json(response);
  }
};

module.exports.UpdateUserProfile = async (req, res) => {
  const response = new BaseResponse();
  try {
    const { id } = req.params; // Lấy ID từ URL params
    const { } = req.body; // Dữ liệu cập nhật
    var updateData = {
    }
    const dataFindById = await userModel.findById(id);
    if (dataFindById) {
      updateData = dataFindById
    } else {
      response.success = false;
      response.message = "No data found to update..";
      return res.json(response);
    }

    var imagePaths = []
    if (req.files && req.files.length > 0) {//Có upload mới
      imagePaths = req.files.map((file, index) => ({
        imageAbsolutePath: `${req.protocol}://${req.get("host")}/uploads/${file.filename}`,
        fileName: file.filename,
        keyToDelete: path.join(__dirname, "..", file.path),
        imageBase64String: "",
        imageFile: null,
        isNewUpload: false,
        displayOrder: index

      }));

    }

    updateData.avatar = imagePaths[0];


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

module.exports.SeachUserProfiles = async (req, res) => {
  let response = new BaseResponse();
  try {
    const { id } = req.params; // Lấy ID từ URL params

    if (!id) {
      response.success = false;
      response.message = "id is required";
      return res.status(400).json(response);
    }

    const result = await userModel.findById(id); // Tìm kiếm theo ID trong MongoDB

    if (!result) {
      response.success = false;
      response.message = "Data not found";
      return res.status(404).json(response);
    }

    response.success = true;
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


// exports.RefreshToken = (req, res) => {
//   const { refreshToken } = req.body;
//   if (!refreshToken) return res.status(401).json({ error: "No refresh token provided" });

//   jwt.verify(refreshToken, refreshTokenSecret, (err, decoded) => {
//     if (err) return res.status(403).json({ error: "Invalid refresh token" });
//     console.log("decoded", decoded);


//     const newAccessToken = jwt.sign(
//       { id: decoded.id },
//       accessTokenSecret,
//       { expiresIn: accessTokenLife }
//     );

//     res.json({ accessToken: newAccessToken });
//   });
// };


exports.RefreshToken = async (req, res) => {
  const response = new BaseResponse();
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      response.message = "No refresh token provided";
      return res.status(401).json(response);
    }


    // Verify refresh token
    jwt.verify(refreshToken, refreshTokenSecret, async (err, decoded) => {
      if (err || !decoded?.id) {
        response.message = "Invalid refresh token";
        return res.status(403).json(response);
      }

      // Tìm người dùng theo ID từ token
      const user = await userModel.findById(decoded.id);
      if (!user || user.refreshToken !== refreshToken) {
        response.message = "User not found or token mismatch";
        return res.status(403).json(response);
      }

      // Tạo access token mới
      const newAccessToken = jwt.sign({ id: user._id, email: user.email, fullName: user.fullName, profilePic: user?.images?.length > 0 ? user?.images[0]?.imageAbsolutePath : "" }, accessTokenSecret, { expiresIn: accessTokenLife });

      // Lưu accessToken mới vào DB (nếu cần)
      await userModel.updateOne({ _id: user._id }, { $set: { accessToken: newAccessToken } });

      // Gửi lại accessToken trong cookie giống như lúc login
      res.cookie('token', newAccessToken, {
        httpOnly: true,
        secure: false, // true nếu chạy HTTPS
        sameSite: 'lax',
        maxAge: 60 * 60 * 1000, // 1 giờ
      });

      response.success = true;
      response.message = "Access token refreshed successfully";
      response.data = { accessToken: newAccessToken };

      res.json(response);
    });

  } catch (error) {
    response.success = false;
    response.message = error.toString();
    res.status(500).json(response);
  }
};

exports.Logout = (req, res) => {
  res.json({ message: "Logged out successfully" }); // Xử lý logout nếu cần
};



exports.AuthVertify = (req, res) => {
  let response = new BaseResponse();
  const authHeader = req.headers.authorization;

  const req_cookies = req.cookies;

  const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer <token>

  if (!token) return res.status(401).json({ ...response, message: "No token provided" });

  jwt.verify(token, accessTokenSecret, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        response.message = err.name;
        response.success = false;
        return res.status(401).json(response); // Có thể dùng 401 hoặc 403 tùy UX
      }

      response.message = "Invalid token";
      response.success = false;
      return res.status(403).json(response);
    }
    req.user = decoded;
    response.success = true;
    response.data = decoded
    return res.json(response)
  });

};



exports.VerifyTokenMiddleware = (req, res, next) => {
  let response = new BaseResponse();
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer <token>

  if (!token) return res.status(401).json({ ...response, message: "No token provided" });

  jwt.verify(token, accessTokenSecret, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        response.message = err.name;
        response.success = false;
        return res.status(401).json(response); // Có thể dùng 401 hoặc 403 tùy UX
      }

      response.message = "Invalid token";
      response.success = false;
      return res.status(403).json(response);
    }

    req.user = decoded;
    next();
  });
};
