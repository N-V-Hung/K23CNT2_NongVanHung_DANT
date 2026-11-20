
const {
    getDevices,
    getDeviceById,
    createDevice,
    updateDevice,
    deleteDevice,
    searchDevices
} = require("../controllers/deviceController");

const {
    authenticate,
    authorize
} = require("../middleware/authMiddleware");

module.exports = async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    const pathname = url.pathname;

    // Chỉ xử lý API thiết bị
    if (
        pathname !== "/api/devices" &&
        !pathname.startsWith("/api/devices/")
    ) {
        return false;
    }

    // Kiểm tra đăng nhập
    const user = await authenticate(req, res);

    if (!user) {
        return true;
    }

    // ==================================
    // UC07 - TÌM KIẾM THIẾT BỊ
    // Manager và Staff
    // ==================================
    if (
        req.method === "GET" &&
        pathname === "/api/devices/search"
    ) {
        if (!authorize(user, ["admin", "manager", "staff"], res)) {
            return true;
        }

        await searchDevices(req, res);
        return true;
    }

    // ==================================
    // UC07 - TRA CỨU CHI TIẾT THIẾT BỊ
    // Manager và Staff
    // Admin vẫn được phép xem theo UC04
    // ==================================
    const detailMatch = pathname.match(
        /^\/api\/devices\/([^/]+)$/
    );

    const id = detailMatch ? detailMatch[1] : null;

    if (req.method === "GET" && id) {
        if (!authorize(user, ["admin", "manager", "staff"], res)) {
            return true;
        }

        await getDeviceById(req, res, id);
        return true;
    }

    // ==================================
    // UC04 - QUẢN LÝ THIẾT BỊ
    // Admin và Manager
    // ==================================
    if (!authorize(user, ["admin", "manager"], res)) {
        return true;
    }

    // GET danh sách thiết bị
    if (
        req.method === "GET" &&
        pathname === "/api/devices"
    ) {
        await getDevices(req, res);
        return true;
    }

    // POST thêm thiết bị
    if (
        req.method === "POST" &&
        pathname === "/api/devices"
    ) {
        await createDevice(req, res);
        return true;
    }

    // PUT cập nhật thiết bị
    if (req.method === "PUT" && id) {
        await updateDevice(req, res, id);
        return true;
    }

    // DELETE xóa thiết bị
    if (req.method === "DELETE" && id) {
        await deleteDevice(req, res, id);
        return true;
    }

    // API không tồn tại
    res.writeHead(404, {
        "Content-Type": "application/json; charset=utf-8"
    });

    res.end(JSON.stringify({
        success: false,
        message: "Device API not found"
    }));

    return true;
};
