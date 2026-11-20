
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

// Đọc dữ liệu JSON
const getBody = (req) => {
    return new Promise((resolve, reject) => {
        let body = "";

        req.on("data", chunk => {
            body += chunk;

            if (body.length > 1024 * 1024) {
                reject(new Error("Dữ liệu gửi lên quá lớn"));
                req.destroy();
            }
        });

        req.on("end", () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch {
                reject(new Error("Dữ liệu JSON không hợp lệ"));
            }
        });

        req.on("error", reject);
    });
};

// Trả kết quả JSON
const response = (res, status, data) => {
    res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8"
    });

    res.end(JSON.stringify(data));
};

// Kiểm tra ID MongoDB
const validId = (id) => mongoose.Types.ObjectId.isValid(id);

// 1. LẤY DANH SÁCH TÀI KHOẢN
const getUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select("-password")
            .sort({ createdAt: -1 });

        return response(res, 200, {
            success: true,
            total: users.length,
            data: users
        });

    } catch (error) {
        console.error("Get users error:", error);

        return response(res, 500, {
            success: false,
            message: "Không thể lấy danh sách tài khoản"
        });
    }
};

// 2. LẤY CHI TIẾT TÀI KHOẢN
const getUserById = async (req, res, id) => {
    try {
        if (!validId(id)) {
            return response(res, 400, {
                success: false,
                message: "ID tài khoản không hợp lệ"
            });
        }

        const user = await User.findById(id).select("-password");

        if (!user) {
            return response(res, 404, {
                success: false,
                message: "Không tìm thấy tài khoản"
            });
        }

        return response(res, 200, {
            success: true,
            data: user
        });

    } catch (error) {
        console.error("Get user error:", error);

        return response(res, 500, {
            success: false,
            message: "Không thể lấy thông tin tài khoản"
        });
    }
};

// 3. THÊM TÀI KHOẢN
const createUser = async (req, res) => {
    try {
        const { email, password, fullName, role, status } =
            await getBody(req);

        if (!email || !password || !fullName || !role) {
            return response(res, 400, {
                success: false,
                message: "Vui lòng nhập đầy đủ thông tin"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return response(res, 400, {
                success: false,
                message: "Email không hợp lệ"
            });
        }

        if (password.length < 6) {
            return response(res, 400, {
                success: false,
                message: "Mật khẩu phải có ít nhất 6 ký tự"
            });
        }

        if (!["admin", "manager", "staff"].includes(role)) {
            return response(res, 400, {
                success: false,
                message: "Vai trò tài khoản không hợp lệ"
            });
        }

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return response(res, 409, {
                success: false,
                message: "Email đã được sử dụng"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            email: normalizedEmail,
            password: hashedPassword,
            fullName: fullName.trim(),
            role,
            status: status === undefined ? true : status
        });

        return response(res, 201, {
            success: true,
            message: "Tạo tài khoản thành công",
            data: {
                id: user._id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                status: user.status
            }
        });

    } catch (error) {
        console.error("Create user error:", error);

        return response(res, 500, {
            success: false,
            message: "Không thể tạo tài khoản"
        });
    }
};

// 4. CẬP NHẬT TÀI KHOẢN
const updateUser = async (req, res, id) => {
    try {
        if (!validId(id)) {
            return response(res, 400, {
                success: false,
                message: "ID tài khoản không hợp lệ"
            });
        }

        const user = await User.findById(id);

        if (!user) {
            return response(res, 404, {
                success: false,
                message: "Không tìm thấy tài khoản"
            });
        }

        const body = await getBody(req);
        const { email, password, fullName, role, status } = body;

        if (email !== undefined) {
            const normalizedEmail = email.trim().toLowerCase();

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
                return response(res, 400, {
                    success: false,
                    message: "Email không hợp lệ"
                });
            }

            const existingUser = await User.findOne({
                email: normalizedEmail,
                _id: { $ne: id }
            });

            if (existingUser) {
                return response(res, 409, {
                    success: false,
                    message: "Email đã được sử dụng"
                });
            }

            user.email = normalizedEmail;
        }

        if (fullName !== undefined) {
            if (typeof fullName !== "string" || !fullName.trim()) {
                return response(res, 400, {
                    success: false,
                    message: "Họ tên không hợp lệ"
                });
            }

            user.fullName = fullName.trim();
        }

        if (role !== undefined) {
            if (!["admin", "manager", "staff"].includes(role)) {
                return response(res, 400, {
                    success: false,
                    message: "Vai trò không hợp lệ"
                });
            }

            if (id === req.user.id && role !== user.role) {
                return response(res, 400, {
                    success: false,
                    message: "Không thể tự thay đổi vai trò của mình"
                });
            }

            user.role = role;
        }

        if (status !== undefined) {
            if (typeof status !== "boolean") {
                return response(res, 400, {
                    success: false,
                    message: "Trạng thái phải là true hoặc false"
                });
            }

            if (id === req.user.id && status === false) {
                return response(res, 400, {
                    success: false,
                    message: "Không thể tự khóa tài khoản của mình"
                });
            }

            user.status = status;
        }

        if (password !== undefined) {
            if (typeof password !== "string" || password.length < 6) {
                return response(res, 400, {
                    success: false,
                    message: "Mật khẩu phải có ít nhất 6 ký tự"
                });
            }

            user.password = await bcrypt.hash(password, 10);
        }

        await user.save();

        return response(res, 200, {
            success: true,
            message: "Cập nhật tài khoản thành công",
            data: {
                id: user._id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                status: user.status
            }
        });

    } catch (error) {
        console.error("Update user error:", error);

        return response(res, 500, {
            success: false,
            message: "Không thể cập nhật tài khoản"
        });
    }
};

// 5. XÓA TÀI KHOẢN
const deleteUser = async (req, res, id) => {
    try {
        if (!validId(id)) {
            return response(res, 400, {
                success: false,
                message: "ID tài khoản không hợp lệ"
            });
        }

        if (id === req.user.id) {
            return response(res, 400, {
                success: false,
                message: "Không thể tự xóa tài khoản của mình"
            });
        }

        const user = await User.findById(id);

        if (!user) {
            return response(res, 404, {
                success: false,
                message: "Không tìm thấy tài khoản"
            });
        }

        if (user.role === "admin") {
            const adminCount = await User.countDocuments({
                role: "admin",
                status: true
            });

            if (adminCount <= 1) {
                return response(res, 400, {
                    success: false,
                    message: "Không thể xóa Admin hoạt động cuối cùng"
                });
            }
        }

        await User.findByIdAndDelete(id);

        return response(res, 200, {
            success: true,
            message: "Xóa tài khoản thành công"
        });

    } catch (error) {
        console.error("Delete user error:", error);

        return response(res, 500, {
            success: false,
            message: "Không thể xóa tài khoản"
        });
    }
};

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
};
