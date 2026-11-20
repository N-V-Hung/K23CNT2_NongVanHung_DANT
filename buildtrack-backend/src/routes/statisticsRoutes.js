
const {
    getStatistics
} = require("../controllers/statisticsController");

const {
    authenticate,
    authorize
} = require("../middleware/authMiddleware");

module.exports = async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    const pathname = url.pathname;

    // Chỉ xử lý API thống kê
    if (pathname !== "/api/statistics") {
        return false;
    }

    // Kiểm tra đăng nhập
    const user = await authenticate(req, res);

    if (!user) {
        return true;
    }

    // UC08: Admin và Manager được xem thống kê
    if (!authorize(user, ["admin", "manager"], res)) {
        return true;
    }

    // GET thống kê tổng quan
    if (
        req.method === "GET" &&
        pathname === "/api/statistics"
    ) {
        await getStatistics(req, res);
        return true;
    }

    res.writeHead(404, {
        "Content-Type": "application/json; charset=utf-8"
    });

    res.end(JSON.stringify({
        success: false,
        message: "Statistics API not found"
    }));

    return true;
};
