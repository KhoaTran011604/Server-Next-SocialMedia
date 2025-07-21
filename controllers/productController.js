
const fs = require('fs');
const path = require('path');
const productModel = require("../models/productModel");
const BaseResponse = require('./BaseResponse');
const xlsx = require("xlsx");
const { uploadCloudinaryFn } = require('./orderController');
const ObjectId = require('mongoose').Types.ObjectId;


module.exports.GetAllProduct = async (req, res) => {
  const response = new BaseResponse();
  try {
    const { keySearch, page = 1, pageSize = 10, sortField = "createdAt", sortOrder = "desc", sortOptions } = req.body;


    const filter = {};
    if (keySearch) {
      filter.$or = [
        { name: { $regex: keySearch, $options: "i" } },
        { description: { $regex: keySearch, $options: "i" } },
      ];
    }

    // Lấy tổng số bản ghi thỏa mãn điều kiện
    const totalRecords = await productModel.countDocuments(filter);

    const data = await productModel
      .aggregate([
        { $match: filter },
        {
          $lookup: {
            from: "categories",
            localField: "categoryId",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } }, // Giải nén category
        {
          $project: {
            name: 1,
            description: 1,
            price: 1,
            status: 1,
            images: 1,
            createdAt: 1,
            categoryId: 1,
            categoryName: { $ifNull: ["$category.name", ""] }, // Đổi tên name thành categoryName và check null thì trả về ""
          },
        },
        { $sort: sortOptions || { _id: 1 } },
        { $skip: (page - 1) * pageSize },
        { $limit: parseInt(pageSize) },
      ]);

    // Trả về kết quả cho frontend
    response.success = true;
    response.data = data;
    response.metaData = {
      totalRecords: totalRecords,
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


module.exports.GetAllProductFK = async (req, res) => {
  const response = new BaseResponse();
  try {
    const sortField = "createdAt";
    const sortOrder = "desc"

    // Xác định hướng sắp xếp (1: tăng dần, -1: giảm dần)
    const sortDirection = sortOrder.toLowerCase() === "asc" ? 1 : -1;
    const sortOptions = { [sortField]: sortDirection };


    // Truy vấn dữ liệu có phân trang và sắp xếp
    const data = await productModel
      .find({}, "_id name price variants")
      .sort(sortOptions); // Áp dụng sắp xếp


    // Trả về kết quả cho frontend
    response.success = true;
    response.data = data;

    res.json(response);
  } catch (error) {
    response.success = false;
    response.message = error.toString();
    res.status(500).json(response);
  }
};




module.exports.SeachProduct = async (req, res) => {
  let response = new BaseResponse();
  try {
    const { id } = req.params; // Lấy ID từ URL params

    if (!id) {
      response.success = false;
      response.message = "id is required";
      return res.status(400).json(response);
    }

    const result = await productModel.findById(id); // Tìm kiếm theo ID trong MongoDB

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



module.exports.CreateProduct = async (req, res) => {
  const response = new BaseResponse();
  try {

    const { name, price, discount, categoryId, status, description, brand, stock, variants } = req.body;



    const imagePath = req.file ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}` : "";
    const newData = {
      name, price, discount, categoryId, status, description, brand, stock, variants, images:
        req.file ?
          [
            {
              imageAbsolutePath: imagePath,
              fileName: file.filename,
              keyToDelete: path.join(__dirname, "..", file.path),
              imageBase64String: "",
              imageFile: null,
              isNewUpload: false,
              displayOrder: 0
            }
          ]
          : []
    }

    //Truy vấn monggo
    const result = await productModel.create(newData);
    if (!result) {
      response.success = false
      response.message = 'An error occurred during the execution, please try again.'
      return res.json(response);
    }
    response.success = true
    response.data = result?._id
    res.json(response);
  } catch (error) {
    response.success = false
    response.message = error.toString()
    res.status(500).json(response);
  }
};
module.exports.UpdateProduct = async (req, res) => {
  const response = new BaseResponse();
  try {
    const { id } = req.params; // Lấy ID từ URL params
    const { name, price, discount, categoryId, status, description, brand, stock, variants, oldImages = [], deleteImages = [] } = req.body; // Dữ liệu cập nhật
    const dataFindById = await productModel.findById(id);
    //Xư lý xóa ảnh deleteImages

    //
    var imagePaths = [];
    var _oldImages = []
    var _deleteImages = []
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


    const updateData = {
      name, price, categoryId, status, description
    }
    if (req.file) {
      const imagePath = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
      imagePaths = [
        {
          imageAbsolutePath: imagePath,
          fileName: file.filename,
          keyToDelete: path.join(__dirname, "..", file.path),
          imageBase64String: "",
          imageFile: null,
          isNewUpload: false,
          displayOrder: 0
        }
      ]
    } else {
      if (_deleteImages?.length > 0) {//Có xóa ảnh cần lọc lại những ảnh chưa bị xóa để cập nhật

        var filterImages = filterRemainingImages(dataFindById.images, _deleteImages, "imageAbsolutePath")
        //Goi hàm xóa ảnh dựa vào _deleteImages

        imagePaths = filterImages
      } else {
        imagePaths = [..._oldImages]
      }
    }

    updateData.images = imagePaths;


    const result = await productModel.findByIdAndUpdate(id, updateData, { new: true });

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

module.exports.CreateProduct_UploadMulti = async (req, res) => {
  const response = new BaseResponse();
  try {

    const { name, price, categoryId = null, status, description, discount, stock, brand, variants } = req.body;
    var _variants = []
    try {
      _variants = JSON.parse(variants)
      _variants = _variants.filter(item => item != null)
    } catch (error) {
      _variants = []
    }
    const newData = {
      //name, price,discount, categoryId, status, description,brand,stock,variants, images: []
      name, price, categoryId: categoryId ? new ObjectId(categoryId) : null, status, description, discount, stock, brand, variants: _variants, images: []
    }
    var imagePaths = []

    if (req.files && req.files.length > 0) {
      // imagePaths = req.files.map((file, index) => ({
      //   imageAbsolutePath: `${req.protocol}://${req.get("host")}/uploads/${file.filename}`,
      //   fileName: file.filename,
      //   keyToDelete: path.join(__dirname, "..", file.path),
      //   imageBase64String: "",
      //   imageFile: null,
      //   isNewUpload: false,
      //   displayOrder: index

      // }));
      imagePaths = await uploadCloudinaryFn(req.files)

    }


    newData.images = imagePaths;

    //Truy vấn monggo
    const result = await productModel.create(newData);
    if (!result) {
      response.success = false
      response.message = 'An error occurred during the execution, please try again.'
      return res.json(response);
    }
    response.success = true
    response.data = result?._id
    res.json(response);
  } catch (error) {
    response.success = false
    response.message = error.toString()
    res.status(500).json(response);
  }
};

module.exports.UpdateProduct_UploadMulti = async (req, res) => {
  const response = new BaseResponse();
  try {
    const { id } = req.params; // Lấy ID từ URL params
    const { name, price, categoryId = null, status, description, discount, stock, brand, variants, oldImages = [], deleteImages = [] } = req.body; // Dữ liệu cập nhật
    const dataFindById = await productModel.findById(id);


    var imagePaths = []
    var imagePaths_v2 = []
    var _oldImages = []
    var _deleteImages = []
    var _variants = []
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
      _variants = JSON.parse(variants)
      _variants = _variants.filter(item => item != null)
    } catch (error) {
      _variants = []
    }

    var updateData = {
      name, price, categoryId: categoryId ? new ObjectId(categoryId) : null, status, description, discount, stock, brand, variants: _variants
    }

    //Xư lý xóa ảnh deleteImages
    if (_deleteImages.length > 0) {
      _deleteImages.map(image => deleteImageFunction(image.keyToDelete))
    }

    //
    if (req.files && req.files.length > 0) {//Có upload mới
      // imagePaths = req.files.map((file, index) => ({
      //   imageAbsolutePath: `${req.protocol}://${req.get("host")}/uploads/${file.filename}`,
      //   fileName: file.filename,
      //   keyToDelete: path.join(__dirname, "..", file.path),
      //   imageBase64String: "",
      //   imageFile: null,
      //   isNewUpload: false,
      //   displayOrder: index

      // }));
      imagePaths = await uploadCloudinaryFn(req.files)

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

    const result = await productModel.findByIdAndUpdate(id, updateData, { new: true });

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

module.exports.DeleteProduct = async (req, res) => {
  const response = new BaseResponse();
  try {
    const { id } = req.params; // Lấy ID từ URL params
    //Tìm & kiểm tra có tồn tại ảnh ko?

    //Xóa ảnh 

    //Xóa product
    const result = await productModel.findByIdAndDelete(id);

    if (!result) {
      response.success = false;
      response.message = "No data found to delete.";
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

module.exports.ImportProducts = async (req, res) => {
  const response = new BaseResponse();
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    let { fromRow = 1, toRow = 1, sheetName = "Sheet1" } = req.body;
    var failedItems = []
    var successCount = 0;
    // Đọc file Excel
    const workbook = xlsx.readFile(req.file.path);
    //const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Lấy phạm vi dữ liệu trong sheet
    const range = xlsx.utils.decode_range(sheet["!ref"]);

    // Mặc định nếu không truyền fromRow/toRow
    fromRow = fromRow ? parseInt(fromRow) : range.s.r + 1;
    toRow = toRow ? parseInt(toRow) : range.e.r;

    if (fromRow < range.s.r + 1 || toRow > range.e.r || fromRow > toRow) {
      response.success = false
      response.message = "Invalid row range"
      return res.status(400).json(response);
    }


    // Đọc từng dòng trong phạm vi từ fromRow đến toRow
    var newData = {}
    for (let rowNum = fromRow; rowNum <= toRow; rowNum++) {
      const row = {
        name: sheet[xlsx.utils.encode_cell({ r: rowNum, c: 0 })]?.v,
        price: sheet[xlsx.utils.encode_cell({ r: rowNum, c: 1 })]?.v,
        categoryId: sheet[xlsx.utils.encode_cell({ r: rowNum, c: 2 })]?.v || null,
        description: sheet[xlsx.utils.encode_cell({ r: rowNum, c: 3 })]?.v || null,
        images: [],
      };

      // Kiểm tra dữ liệu hợp lệ trước khi thêm vào DB
      newData = { ...row }
      if (newData.name) {
        try {
          await productModel.create(newData);
          successCount++;
        } catch (error) {
          failedItems.push({ newData, error: error.message });
        }
      } else {
        failedItems.push({ newData, error: "Required field" });
      }
    }

    // Xóa file sau khi xử lý
    fs.unlinkSync(req.file.path);

    var URL_dowloadFailed = exportToExcel(req, failedItems)

    if (data.length == 0 || URL_dowload == "") {
      response.success = false;
      response.message = "Không có dữ liệu để export!";
      return res.json(response);
    }
    response.success = true;
    response.message = "Import  thành công!";
    response.data = {
      successCount: successCount,
      failed: failedItems.length,
      failedItems,
      URL_dowloadFailed: URL_dowloadFailed,
    }
    res.json(response);
  } catch (error) {
    response.success = false;
    response.message = error.toString();
    res.status(500).json(response);
  }
};


module.exports.ExportWithFilter = async (req, res) => {
  const response = new BaseResponse();
  try {
    let URL_dowload = "";
    const { keySearch, sortField = "createdAt", sortOrder = "desc" } = req.body;


    const filter = {};
    if (keySearch) {
      filter.$or = [
        { name: { $regex: keySearch, $options: "i" } },
        { description: { $regex: keySearch, $options: "i" } },
      ];
    }

    const data = await productModel
      .find(filter)
      .sort({ [sortField]: sortOrder === "desc" ? -1 : 1 });

    URL_dowload = exportToExcel(req, data);

    if (data.length == 0 || URL_dowload == "") {
      response.success = false;
      response.message = "Không có dữ liệu để export!";
      return res.json(response);
    }

    response.success = true;
    response.message = "Export thành công!";
    response.data = URL_dowload;
    res.json(response);
  } catch (error) {
    response.success = false;
    response.message = error.toString();
    res.status(500).json(response);
  }
};


module.exports.ExportAllProduct = async (req, res) => {
  const response = new BaseResponse();
  try {
    var URL_dowload = "";
    const data = await productModel.find().sort({ _id: 1 }).exec();

    URL_dowload = exportToExcel(req, data)

    response.success = true;
    response.message = "Export  thành công!";
    response.data = URL_dowload
    res.json(response);
  } catch (error) {
    response.success = false;
    response.message = error.toString();
    res.status(500).json(response);
  }
};



function exportToExcel(req, data) {
  if (data?.length == 0) {
    return ""
  }
  var result = ""

  const EXPORT_DIR = path.resolve(__dirname, "..", "exports");

  if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
  }

  try {
    const fileName = `ExportProduct_${Date.now()}.xlsx`;
    const filePath = path.join(EXPORT_DIR, fileName);

    // Header tùy chỉnh
    const worksheet = xlsx.utils.aoa_to_sheet([
      ["Tên ", "Số lượng cây", "Diện tích", "Mô tả"], // Header
    ]);

    // Thêm dữ liệu vào sheet
    const dataRows = data.map((item) => [item.name, item.numberOfPlants, item.landArea, item.description]);
    xlsx.utils.sheet_add_aoa(worksheet, dataRows, { origin: "A2" });

    // Tạo workbook và ghi file
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    xlsx.writeFile(workbook, filePath);
    result = `${req.protocol}://${req.get("host")}/exports/${fileName}`
  } catch (error) {
    return result
  }
  return result;
}

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













