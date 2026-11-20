
const {
    login,
    logout
} = require("../controllers/authController");

const authRoutes = async (req, res) => {
    const pathname = new URL(
        req.url,
        "http://localhost"
    ).pathname;

    // Đăng nhập: KHÔNG yêu cầu JWT
    if (req.method === "POST" && pathname === "/api/auth/login") {
        await login(req, res);
        return true;
    }

    // Đăng xuất
    if (req.method === "POST" && pathname === "/api/auth/logout") {
        logout(req, res);
        return true;
    }

    return false;
};

module.exports = authRoutes;
