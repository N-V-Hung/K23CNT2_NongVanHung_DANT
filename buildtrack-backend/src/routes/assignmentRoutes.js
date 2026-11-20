
const {
    getAssignments,
    getAssignmentById,
    createAssignment,
    updateAssignment,
    deleteAssignment
} = require("../controllers/assignmentController");

const {
    authenticate,
    authorize
} = require("../middleware/authMiddleware");

module.exports = async (req, res) => {
    console.log(">>> ASSIGNMENT ROUTE ĐÃ ĐƯỢC GỌI <<<");

    const url = new URL(req.url, "http://localhost");
    const pathname = url.pathname;

    if (
        pathname !== "/api/assignments" &&
        !pathname.startsWith("/api/assignments/")
    ) {
        return false;
    }

    // Kiểm tra đăng nhập
    const user = await authenticate(req, res);
    console.log("Assignment user:", user);
    console.log("Assignment role:", user?.role);
    if (!user) {
        return true;
    }

    // Chỉ Manager được quản lý phân công
    if (!authorize(user, ["manager"], res)) {
        return true;
    }

    const id = pathname.split("/")[3];

    // GET danh sách phân công
    if (
        req.method === "GET" &&
        pathname === "/api/assignments"
    ) {
        await getAssignments(req, res);
        return true;
    }

    // GET chi tiết phân công
    if (req.method === "GET" && id) {
        await getAssignmentById(req, res, id);
        return true;
    }

    // POST thêm phân công
    if (
        req.method === "POST" &&
        pathname === "/api/assignments"
    ) {
        await createAssignment(req, res);
        return true;
    }

    // PUT cập nhật phân công
    if (req.method === "PUT" && id) {
        await updateAssignment(req, res, id);
        return true;
    }

    // DELETE xóa phân công
    if (req.method === "DELETE" && id) {
        await deleteAssignment(req, res, id);
        return true;
    }

    res.writeHead(404);
    res.end(JSON.stringify({
        success: false,
        message: "Assignment API not found"
    }));

    return true;
};
