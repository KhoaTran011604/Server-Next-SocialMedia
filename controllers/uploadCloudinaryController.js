const cloudinary = require("cloudinary").v2;
const fs = require("fs");
//const dotenv = require("dotenv");
//dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadCloudinaryMultipleImages = async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

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


    res.json({
      message: "Files uploaded successfully",
      dataImages: dataImages
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const uploadCloudinaryMultipleImagesFn = async (filesFromRequest) => {
  try {
    const files = filesFromRequest;
    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    let uploadResults = [];

    for (const file of files) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: process.env.FOLDER,//"my_upload",//"uploads", // Thư mục trên Cloudinary
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
  } catch (err) {
    return []
  }
};

const deleteImage = async (public_id) => {//keyToDelete
  try {

    if (!public_id) {
      return res.status(400).json({ message: "Missing public_id" });
    }

    const result = await cloudinary.uploader.destroy(public_id);

    if (result.result === "ok") {
      return ({
        succsess: true,
        data: result,
        message: "Xóa ảnh thành công"
      })
    } else {
      return ({
        succsess: false,
        data: null,
        message: "Lỗi khi xóa ảnh"
      })
    }
  } catch (error) {
    return ({
      succsess: false,
      data: null,
      message: "Lỗi: " + error.message
    })
  }
};


module.exports = { uploadCloudinaryMultipleImages, uploadCloudinaryMultipleImagesFn, deleteImage };
