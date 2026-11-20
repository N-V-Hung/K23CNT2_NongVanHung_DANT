
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Đọc dữ liệu JSON từ Request
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

// Hàm trả dữ liệu JSON
const sendResponse = (res, statusCode, data) => {
    res.writeHead(statusCode, {
        "Content-Type": "application/json; charset=utf-8"
    });

    res.end(JSON.stringify(data));
};

// ==============================
// ĐĂNG NHẬP
// ==============================
const login = async (req, res) => {
    try {
        const { email, password } = await getRequestBody(req);

        // Kiểm tra dữ liệu đầu vào
        if (!email || !password) {
            return sendResponse(res, 400, {
                success: false,
                message: "Vui lòng nhập email và mật khẩu"
            });
        }

        // Tìm tài khoản
        const user = await User.findOne({
            email: email.trim().toLowerCase()
        }).select("+password");

        if (!user) {
            return sendResponse(res, 401, {
                success: false,
                message: "Email hoặc mật khẩu không chính xác"
            });
        }

        // Kiểm tra trạng thái tài khoản
        if (!user.status) {
            return sendResponse(res, 403, {
                success: false,
                message: "Tài khoản đã bị khóa"
            });
        }

        // Kiểm tra mật khẩu
        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return sendResponse(res, 401, {
                success: false,
                message: "Email hoặc mật khẩu không chính xác"
            });
        }

        // Tạo JWT Token
        const token = jwt.sign(
            {
                id: user._id.toString(),
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || "1d"
            }
        );

        // Trả kết quả đăng nhập
        return sendResponse(res, 200, {
            success: true,
            message: "Đăng nhập thành công",
            token,
            user: {
                id: user._id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                status: user.status
            }
        });

    } catch (error) {
        console.error("Login error:", error.message);

        return sendResponse(res, 500, {
            success: false,
            message: "Lỗi máy chủ khi đăng nhập"
        });
    }
};

// ==============================
// ĐĂNG XUẤT
// ==============================
const logout = (req, res) => {
    return sendResponse(res, 200, {
        success: true,
        message: "Đăng xuất thành công. Vui lòng xóa token ở phía Client."
    });
};

module.exports = {
    login,
    logout
};
