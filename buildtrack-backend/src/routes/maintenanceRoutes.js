
const {
    getMaintenances,
    getMaintenanceById,
    createMaintenance,
    updateMaintenance,
    deleteMaintenance
} = require("../controllers/maintenanceController");

const {
    authenticate,
    authorize
} = require("../middleware/authMiddleware");

module.exports = async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    const pathname = url.pathname;

    // Chỉ xử lý API bảo trì
    if (
        pathname !== "/api/maintenances" &&
        !pathname.startsWith("/api/maintenances/")
    ) {
        return false;
    }

    // Kiểm tra đăng nhập
    const user = await authenticate(req, res);

    if (!user) {
        return true;
    }

    // Chỉ Manager được quản lý bảo trì
    if (!authorize(user, ["manager"], res)) {
        return true;
    }

    const id = pathname.split("/")[3];

    // GET danh sách bảo trì
    if (
        req.method === "GET" &&
        pathname === "/api/maintenances"
    ) {
        await getMaintenances(req, res);
        return true;
    }

    // GET chi tiết bảo trì
    if (req.method === "GET" && id) {
        await getMaintenanceById(req, res, id);
        return true;
    }

    // POST thêm lịch bảo trì
    if (
        req.method === "POST" &&
        pathname === "/api/maintenances"
    ) {
        await createMaintenance(req, res);
        return true;
    }

    // PUT cập nhật bảo trì
    if (req.method === "PUT" && id) {
        await updateMaintenance(req, res, id);
        return true;
    }

    // DELETE xóa bảo trì
    if (req.method === "DELETE" && id) {
        await deleteMaintenance(req, res, id);
        return true;
    }

    res.writeHead(404);
    res.end(JSON.stringify({
        success: false,
        message: "Maintenance API not found"
    }));

    return true;
};
