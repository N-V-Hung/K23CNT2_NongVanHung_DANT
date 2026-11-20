
const mongoose = require("mongoose");

const Maintenance = require("../models/Maintenance");
const Device = require("../models/Device");

// Gửi phản hồi JSON
const sendJSON = (res, statusCode, data) => {
    res.writeHead(statusCode);
    res.end(JSON.stringify(data));
};

// Đọc dữ liệu JSON
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

// 1. Lấy danh sách bảo trì
const getMaintenances = async (req, res) => {
    try {
        const maintenances = await Maintenance.find()
            .populate("deviceId", "deviceCode name")
            .sort({ createdAt: -1 });

        return sendJSON(res, 200, {
            success: true,
            message: "Lấy danh sách bảo trì thành công",
            data: maintenances
        });
    } catch (error) {
        console.error("Get maintenances error:", error);

        return sendJSON(res, 500, {
            success: false,
            message: "Không thể lấy danh sách bảo trì"
        });
    }
};

// 2. Lấy chi tiết bảo trì
const getMaintenanceById = async (req, res, id) => {
    try {
        if (!isValidId(id)) {
            return sendJSON(res, 400, {
                success: false,
                message: "ID bảo trì không hợp lệ"
            });
        }

        const maintenance = await Maintenance.findById(id)
            .populate("deviceId", "deviceCode name");

        if (!maintenance) {
            return sendJSON(res, 404, {
                success: false,
                message: "Không tìm thấy thông tin bảo trì"
            });
        }

        return sendJSON(res, 200, {
            success: true,
            message: "Lấy thông tin bảo trì thành công",
            data: maintenance
        });
    } catch (error) {
        console.error("Get maintenance error:", error);

        return sendJSON(res, 500, {
            success: false,
            message: "Không thể lấy thông tin bảo trì"
        });
    }
};

// 3. Thêm lịch bảo trì
const createMaintenance = async (req, res) => {
    try {
        const body = await getRequestBody(req);

        const {
            deviceId,
            maintenanceDate,
            maintenanceType,
            content,
            cost,
            status,
            note
        } = body;

        if (
            !deviceId ||
            !maintenanceDate ||
            !maintenanceType ||
            !content
        ) {
            return sendJSON(res, 400, {
                success: false,
                message: "Vui lòng nhập đầy đủ thông tin bảo trì"
            });
        }

        if (!isValidId(deviceId)) {
            return sendJSON(res, 400, {
                success: false,
                message: "ID thiết bị không hợp lệ"
            });
        }

        const device = await Device.findById(deviceId);

        if (!device) {
            return sendJSON(res, 404, {
                success: false,
                message: "Thiết bị không tồn tại"
            });
        }

        const parsedDate = new Date(maintenanceDate);

        if (Number.isNaN(parsedDate.getTime())) {
            return sendJSON(res, 400, {
                success: false,
                message: "Ngày bảo trì không hợp lệ"
            });
        }

        if (
            cost !== undefined &&
            (!Number.isFinite(Number(cost)) || Number(cost) < 0)
        ) {
            return sendJSON(res, 400, {
                success: false,
                message: "Chi phí bảo trì phải là số không âm"
            });
        }

        const maintenance = await Maintenance.create({
            deviceId,
            maintenanceDate: parsedDate,
            maintenanceType,
            content,
            cost: cost === undefined ? 0 : Number(cost),
            status: status || "pending",
            note: note || ""
        });

        return sendJSON(res, 201, {
            success: true,
            message: "Thêm lịch bảo trì thành công",
            data: maintenance
        });
    } catch (error) {
        console.error("Create maintenance error:", error);

        return sendJSON(res, 500, {
            success: false,
            message: "Không thể thêm lịch bảo trì"
        });
    }
};

// 4. Cập nhật bảo trì
const updateMaintenance = async (req, res, id) => {
    try {
        if (!isValidId(id)) {
            return sendJSON(res, 400, {
                success: false,
                message: "ID bảo trì không hợp lệ"
            });
        }

        const maintenance = await Maintenance.findById(id);

        if (!maintenance) {
            return sendJSON(res, 404, {
                success: false,
                message: "Không tìm thấy thông tin bảo trì"
            });
        }

        const body = await getRequestBody(req);

        const allowedFields = [
            "deviceId",
            "maintenanceDate",
            "maintenanceType",
            "content",
            "cost",
            "status",
            "note"
        ];

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                maintenance[field] = body[field];
            }
        }

        if (
            !maintenance.deviceId ||
            !maintenance.maintenanceDate ||
            !maintenance.maintenanceType ||
            !maintenance.content
        ) {
            return sendJSON(res, 400, {
                success: false,
                message: "Vui lòng nhập đầy đủ thông tin bảo trì"
            });
        }

        if (!isValidId(maintenance.deviceId)) {
            return sendJSON(res, 400, {
                success: false,
                message: "ID thiết bị không hợp lệ"
            });
        }

        const device = await Device.findById(maintenance.deviceId);

        if (!device) {
            return sendJSON(res, 404, {
                success: false,
                message: "Thiết bị không tồn tại"
            });
        }

        if (
            Number.isNaN(
                new Date(maintenance.maintenanceDate).getTime()
            )
        ) {
            return sendJSON(res, 400, {
                success: false,
                message: "Ngày bảo trì không hợp lệ"
            });
        }

        if (
            !Number.isFinite(Number(maintenance.cost)) ||
            Number(maintenance.cost) < 0
        ) {
            return sendJSON(res, 400, {
                success: false,
                message: "Chi phí bảo trì phải là số không âm"
            });
        }

        await maintenance.save();

        return sendJSON(res, 200, {
            success: true,
            message: "Cập nhật thông tin bảo trì thành công",
            data: maintenance
        });
    } catch (error) {
        console.error("Update maintenance error:", error);

        return sendJSON(res, 500, {
            success: false,
            message: "Không thể cập nhật thông tin bảo trì"
        });
    }
};

// 5. Xóa bảo trì
const deleteMaintenance = async (req, res, id) => {
    try {
        if (!isValidId(id)) {
            return sendJSON(res, 400, {
                success: false,
                message: "ID bảo trì không hợp lệ"
            });
        }

        const maintenance = await Maintenance.findById(id);

        if (!maintenance) {
            return sendJSON(res, 404, {
                success: false,
                message: "Không tìm thấy thông tin bảo trì"
            });
        }

        await Maintenance.findByIdAndDelete(id);

        return sendJSON(res, 200, {
            success: true,
            message: "Xóa thông tin bảo trì thành công"
        });
    } catch (error) {
        console.error("Delete maintenance error:", error);

        return sendJSON(res, 500, {
            success: false,
            message: "Không thể xóa thông tin bảo trì"
        });
    }
};

module.exports = {
    getMaintenances,
    getMaintenanceById,
    createMaintenance,
    updateMaintenance,
    deleteMaintenance
};
