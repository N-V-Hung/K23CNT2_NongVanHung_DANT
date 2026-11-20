
const mongoose = require("mongoose");
const Device = require("../models/Device");
const Category = require("../models/Category");

// Gửi phản hồi JSON
const sendJSON = (res, statusCode, data) => {
    res.writeHead(statusCode);
    res.end(JSON.stringify(data));
};

// Đọc dữ liệu JSON từ request
const getRequestBody = (req) => {
    return new Promise((resolve, reject) => {
        let body = "";

        req.on("data", (chunk) => {
            body += chunk;

            if (body.length > 1024 * 1024) {
                reject(new Error("Request body quá lớn"));
                req.destroy();
            }
        });

        req.on("end", () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (error) {
                reject(new Error("Dữ liệu JSON không hợp lệ"));
            }
        });

        req.on("error", reject);
    });
};

// Kiểm tra ObjectId
const isValidId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

// 1. Lấy danh sách thiết bị
const getDevices = async (req, res) => {
    try {
        const devices = await Device.find()
            .populate("categoryId", "name")
            .sort({ createdAt: -1 });

        return sendJSON(res, 200, {
            success: true,
            message: "Lấy danh sách thiết bị thành công",
            data: devices
        });
    } catch (error) {
        console.error("Get devices error:", error);

        return sendJSON(res, 500, {
            success: false,
            message: "Không thể lấy danh sách thiết bị"
        });
    }
};

// 2. Lấy chi tiết thiết bị
const getDeviceById = async (req, res, id) => {
    try {
        if (!isValidId(id)) {
            return sendJSON(res, 400, {
                success: false,
                message: "ID thiết bị không hợp lệ"
            });
        }

        const device = await Device.findById(id)
            .populate("categoryId", "name");

        if (!device) {
            return sendJSON(res, 404, {
                success: false,
                message: "Không tìm thấy thiết bị"
            });
        }

        return sendJSON(res, 200, {
            success: true,
            message: "Lấy thông tin thiết bị thành công",
            data: device
        });
    } catch (error) {
        console.error("Get device error:", error);

        return sendJSON(res, 500, {
            success: false,
            message: "Không thể lấy thông tin thiết bị"
        });
    }
};

// 3. Thêm thiết bị
const createDevice = async (req, res) => {
    try {
        const body = await getRequestBody(req);

        const {
            deviceCode,
            name,
            categoryId,
            description,
            status
        } = body;

        if (!deviceCode || !name || !categoryId) {
            return sendJSON(res, 400, {
                success: false,
                message: "Vui lòng nhập mã thiết bị, tên thiết bị và danh mục"
            });
        }

        if (!isValidId(categoryId)) {
            return sendJSON(res, 400, {
                success: false,
                message: "ID danh mục không hợp lệ"
            });
        }

        const category = await Category.findById(categoryId);

        if (!category) {
            return sendJSON(res, 404, {
                success: false,
                message: "Danh mục không tồn tại"
            });
        }

        const existingDevice = await Device.findOne({
            deviceCode: deviceCode.trim()
        });

        if (existingDevice) {
            return sendJSON(res, 409, {
                success: false,
                message: "Mã thiết bị đã tồn tại"
            });
        }

        const device = await Device.create({
            deviceCode,
            name,
            categoryId,
            description,
            status
        });

        return sendJSON(res, 201, {
            success: true,
            message: "Thêm thiết bị thành công",
            data: device
        });
    } catch (error) {
        console.error("Create device error:", error);

        return sendJSON(res, 500, {
            success: false,
            message: "Không thể thêm thiết bị"
        });
    }
};

// 4. Cập nhật thiết bị
const updateDevice = async (req, res, id) => {
    try {
        if (!isValidId(id)) {
            return sendJSON(res, 400, {
                success: false,
                message: "ID thiết bị không hợp lệ"
            });
        }

        const body = await getRequestBody(req);

        const device = await Device.findById(id);

        if (!device) {
            return sendJSON(res, 404, {
                success: false,
                message: "Không tìm thấy thiết bị"
            });
        }

        const allowedFields = [
            "deviceCode",
            "name",
            "categoryId",
            "description",
            "status"
        ];

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                device[field] = body[field];
            }
        }

        if (!device.deviceCode || !device.name || !device.categoryId) {
            return sendJSON(res, 400, {
                success: false,
                message: "Mã thiết bị, tên thiết bị và danh mục không được để trống"
            });
        }

        if (!isValidId(device.categoryId)) {
            return sendJSON(res, 400, {
                success: false,
                message: "ID danh mục không hợp lệ"
            });
        }

        const category = await Category.findById(device.categoryId);

        if (!category) {
            return sendJSON(res, 404, {
                success: false,
                message: "Danh mục không tồn tại"
            });
        }

        const duplicateDevice = await Device.findOne({
            deviceCode: device.deviceCode.trim(),
            _id: { $ne: id }
        });

        if (duplicateDevice) {
            return sendJSON(res, 409, {
                success: false,
                message: "Mã thiết bị đã được sử dụng"
            });
        }

        await device.save();

        return sendJSON(res, 200, {
            success: true,
            message: "Cập nhật thiết bị thành công",
            data: device
        });
    } catch (error) {
        console.error("Update device error:", error);

        return sendJSON(res, 500, {
            success: false,
            message: "Không thể cập nhật thiết bị"
        });
    }
};

// 5. Xóa thiết bị
const deleteDevice = async (req, res, id) => {
    try {
        if (!isValidId(id)) {
            return sendJSON(res, 400, {
                success: false,
                message: "ID thiết bị không hợp lệ"
            });
        }

        const device = await Device.findById(id);

        if (!device) {
            return sendJSON(res, 404, {
                success: false,
                message: "Không tìm thấy thiết bị"
            });
        }

        await Device.findByIdAndDelete(id);

        return sendJSON(res, 200, {
            success: true,
            message: "Xóa thiết bị thành công"
        });
    } catch (error) {
        console.error("Delete device error:", error);

        return sendJSON(res, 500, {
            success: false,
            message: "Không thể xóa thiết bị"
        });
    }
};


// 6. Tìm kiếm và tra cứu thiết bị (UC07)
const searchDevices = async (req, res) => {
    try {
        const url = new URL(req.url, "http://localhost");

        const keyword = url.searchParams.get("keyword") || "";
        const categoryId = url.searchParams.get("categoryId") || "";
        const status = url.searchParams.get("status") || "";

        const filter = {};

        // Tìm theo mã hoặc tên thiết bị
        if (keyword.trim()) {
            const escapedKeyword = keyword.trim().replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

            filter.$or = [
                { deviceCode: { $regex: escapedKeyword, $options: "i" } },
                { name: { $regex: escapedKeyword, $options: "i" } }
            ];
        }

        // Lọc theo danh mục
        if (categoryId) {
            if (!isValidId(categoryId)) {
                return sendJSON(res, 400, {
                    success: false,
                    message: "ID danh mục không hợp lệ"
                });
            }

            filter.categoryId = categoryId;
        }

        // Lọc theo trạng thái
        if (status) {
            filter.status = status;
        }

        const devices = await Device.find(filter)
            .populate("categoryId", "name")
            .sort({ createdAt: -1 });

        return sendJSON(res, 200, {
            success: true,
            message: "Tìm kiếm thiết bị thành công",
            total: devices.length,
            data: devices
        });

    } catch (error) {
        console.error("Search devices error:", error);

        return sendJSON(res, 500, {
            success: false,
            message: "Không thể tìm kiếm thiết bị"
        });
    }
};


module.exports = {
    getDevices,
    getDeviceById,
    createDevice,
    updateDevice,
    deleteDevice,
    searchDevices
};
