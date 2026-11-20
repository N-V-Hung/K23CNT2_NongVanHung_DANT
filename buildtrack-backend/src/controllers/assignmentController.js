
const mongoose = require("mongoose");

const Assignment = require("../models/Assignment");
const Device = require("../models/Device");
const User = require("../models/User");

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

// 1. Lấy danh sách phân công
const getAssignments = async (req, res) => {
    try {
        const assignments = await Assignment.find()
            .populate("deviceId", "deviceCode name")
            .populate("userId", "fullName email role")
            .sort({ createdAt: -1 });

        return sendJSON(res, 200, {
            success: true,
            message: "Lấy danh sách phân công thành công",
            data: assignments
        });
    } catch (error) {
        console.error("Get assignments error:", error);

        return sendJSON(res, 500, {
            success: false,
            message: "Không thể lấy danh sách phân công"
        });
    }
};

// 2. Lấy chi tiết phân công
const getAssignmentById = async (req, res, id) => {
    try {
        if (!isValidId(id)) {
            return sendJSON(res, 400, {
                success: false,
                message: "ID phân công không hợp lệ"
            });
        }

        const assignment = await Assignment.findById(id)
            .populate("deviceId", "deviceCode name")
            .populate("userId", "fullName email role");

        if (!assignment) {
            return sendJSON(res, 404, {
                success: false,
                message: "Không tìm thấy phân công"
            });
        }

        return sendJSON(res, 200, {
            success: true,
            message: "Lấy thông tin phân công thành công",
            data: assignment
        });
    } catch (error) {
        console.error("Get assignment error:", error);

        return sendJSON(res, 500, {
            success: false,
            message: "Không thể lấy thông tin phân công"
        });
    }
};

// 3. Thêm phân công
const createAssignment = async (req, res) => {
    try {
        const body = await getRequestBody(req);

        const {
            deviceId,
            userId,
            constructionSite,
            siteAddress,
            assignedDate,
            returnDate,
            status,
            note
        } = body;

        if (
            !deviceId ||
            !userId ||
            !constructionSite ||
            !siteAddress ||
            !assignedDate
        ) {
            return sendJSON(res, 400, {
                success: false,
                message: "Vui lòng nhập đầy đủ thông tin phân công"
            });
        }

        if (!isValidId(deviceId) || !isValidId(userId)) {
            return sendJSON(res, 400, {
                success: false,
                message: "ID thiết bị hoặc người sử dụng không hợp lệ"
            });
        }

        const device = await Device.findById(deviceId);

        if (!device) {
            return sendJSON(res, 404, {
                success: false,
                message: "Thiết bị không tồn tại"
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return sendJSON(res, 404, {
                success: false,
                message: "Người sử dụng không tồn tại"
            });
        }

        if (user.role !== "staff") {
            return sendJSON(res, 400, {
                success: false,
                message: "Chỉ được phân công cho người sử dụng thiết bị"
            });
        }

        if (user.status !== true) {
            return sendJSON(res, 400, {
                success: false,
                message: "Tài khoản người sử dụng không hoạt động"
            });
        }

        const existingAssignment = await Assignment.findOne({
            deviceId,
            status: "active"
        });

        if (existingAssignment) {
            return sendJSON(res, 409, {
                success: false,
                message: "Thiết bị đang được phân công"
            });
        }

        const assignment = await Assignment.create({
            deviceId,
            userId,
            constructionSite,
            siteAddress,
            assignedDate,
            returnDate: returnDate || null,
            status: status || "active",
            note: note || ""
        });

        return sendJSON(res, 201, {
            success: true,
            message: "Phân công thiết bị thành công",
            data: assignment
        });
    } catch (error) {
        console.error("Create assignment error:", error);

        return sendJSON(res, 500, {
            success: false,
            message: "Không thể tạo phân công"
        });
    }
};

// 4. Cập nhật phân công
const updateAssignment = async (req, res, id) => {
    try {
        if (!isValidId(id)) {
            return sendJSON(res, 400, {
                success: false,
                message: "ID phân công không hợp lệ"
            });
        }

        const assignment = await Assignment.findById(id);

        if (!assignment) {
            return sendJSON(res, 404, {
                success: false,
                message: "Không tìm thấy phân công"
            });
        }

        const body = await getRequestBody(req);

        const allowedFields = [
            "deviceId",
            "userId",
            "constructionSite",
            "siteAddress",
            "assignedDate",
            "returnDate",
            "status",
            "note"
        ];

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                assignment[field] = body[field];
            }
        }

        if (
            !assignment.deviceId ||
            !assignment.userId ||
            !assignment.constructionSite ||
            !assignment.siteAddress ||
            !assignment.assignedDate
        ) {
            return sendJSON(res, 400, {
                success: false,
                message: "Thông tin phân công không được để trống"
            });
        }

        if (
            !isValidId(assignment.deviceId) ||
            !isValidId(assignment.userId)
        ) {
            return sendJSON(res, 400, {
                success: false,
                message: "ID thiết bị hoặc người sử dụng không hợp lệ"
            });
        }

        const device = await Device.findById(assignment.deviceId);
        const user = await User.findById(assignment.userId);

        if (!device || !user) {
            return sendJSON(res, 404, {
                success: false,
                message: "Thiết bị hoặc người sử dụng không tồn tại"
            });
        }

        if (user.role !== "staff" || user.status !== true) {
            return sendJSON(res, 400, {
                success: false,
                message: "Người sử dụng không hợp lệ hoặc tài khoản không hoạt động"
            });
        }

        if (assignment.status === "active") {
            const existingAssignment = await Assignment.findOne({
                deviceId: assignment.deviceId,
                status: "active",
                _id: { $ne: id }
            });

            if (existingAssignment) {
                return sendJSON(res, 409, {
                    success: false,
                    message: "Thiết bị đang được phân công trong một bản ghi khác"
                });
            }
        }

        await assignment.save();

        return sendJSON(res, 200, {
            success: true,
            message: "Cập nhật phân công thành công",
            data: assignment
        });
    } catch (error) {
        console.error("Update assignment error:", error);

        return sendJSON(res, 500, {
            success: false,
            message: "Không thể cập nhật phân công"
        });
    }
};

// 5. Xóa phân công
const deleteAssignment = async (req, res, id) => {
    try {
        if (!isValidId(id)) {
            return sendJSON(res, 400, {
                success: false,
                message: "ID phân công không hợp lệ"
            });
        }

        const assignment = await Assignment.findById(id);

        if (!assignment) {
            return sendJSON(res, 404, {
                success: false,
                message: "Không tìm thấy phân công"
            });
        }

        await Assignment.findByIdAndDelete(id);

        return sendJSON(res, 200, {
            success: true,
            message: "Xóa phân công thành công"
        });
    } catch (error) {
        console.error("Delete assignment error:", error);

        return sendJSON(res, 500, {
            success: false,
            message: "Không thể xóa phân công"
        });
    }
};

module.exports = {
    getAssignments,
    getAssignmentById,
    createAssignment,
    updateAssignment,
    deleteAssignment
};
