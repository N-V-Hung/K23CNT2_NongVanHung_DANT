
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ==================================
// XÁC THỰC JWT TOKEN
// ==================================
const authenticate = async (req, res) => {
    try {
        // Lấy token từ Header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.writeHead(401, {
                "Content-Type": "application/json; charset=utf-8"
            });

            res.end(JSON.stringify({
                success: false,
                message: "Vui lòng đăng nhập để tiếp tục"
            }));

            return null;
        }

        // Tách token
        const token = authHeader.split(" ")[1];

        if (!token) {
            res.writeHead(401, {
                "Content-Type": "application/json; charset=utf-8"
            });

            res.end(JSON.stringify({
                success: false,
                message: "Token không hợp lệ"
            }));

            return null;
        }

        // Kiểm tra JWT
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Tìm người dùng trong Database
        const user = await User.findById(decoded.id);

        if (!user) {
            res.writeHead(401, {
                "Content-Type": "application/json; charset=utf-8"
            });

            res.end(JSON.stringify({
                success: false,
                message: "Tài khoản không tồn tại"
            }));

            return null;
        }

        // Kiểm tra trạng thái tài khoản
        if (!user.status) {
            res.writeHead(403, {
                "Content-Type": "application/json; charset=utf-8"
            });

            res.end(JSON.stringify({
                success: false,
                message: "Tài khoản đã bị khóa"
            }));

            return null;
        }

        // Gắn thông tin người dùng vào Request
        req.user = {
            id: user._id.toString(),
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            status: user.status
        };

        return req.user;

    } catch (error) {
        let message = "Token không hợp lệ";

        if (error.name === "TokenExpiredError") {
            message = "Token đã hết hạn, vui lòng đăng nhập lại";
        }

        res.writeHead(401, {
            "Content-Type": "application/json; charset=utf-8"
        });

        res.end(JSON.stringify({
            success: false,
            message
        }));

        return null;
    }
};

// ==================================
// PHÂN QUYỀN NGƯỜI DÙNG
// ==================================
const authorize = (user, allowedRoles, res) => {

    if (!user) {
        res.writeHead(401, {
            "Content-Type": "application/json; charset=utf-8"
        });

        res.end(JSON.stringify({
            success: false,
            message: "Bạn chưa đăng nhập"
        }));

        return false;
    }

    if (!allowedRoles.includes(user.role)) {
        res.writeHead(403, {
            "Content-Type": "application/json; charset=utf-8"
        });

        res.end(JSON.stringify({
            success: false,
            message: "Bạn không có quyền truy cập chức năng này"
        }));

        return false;
    }

    return true;
};

module.exports = {
    authenticate,
    authorize
};
