
const {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
} = require("../controllers/userController");

const {
    authenticate,
    authorize
} = require("../middleware/authMiddleware");

const userRoutes = async (req, res) => {
    const method = req.method;
    const pathname = new URL(
        req.url,
        "http://localhost"
    ).pathname;

    // Chỉ xử lý API thuộc /api/users
    if (
        pathname !== "/api/users" &&
        !pathname.startsWith("/api/users/")
    ) {
        return false;
    }

    // Kiểm tra đăng nhập
    const user = await authenticate(req, res);

    if (!user) {
        return true;
    }

    // Chỉ Admin được sử dụng UC02
    const hasPermission = authorize(
        user,
        ["admin"],
        res
    );

    if (!hasPermission) {
        return true;
    }

    // GET: Danh sách tài khoản
    if (method === "GET" && pathname === "/api/users") {
        await getUsers(req, res);
        return true;
    }

    // POST: Thêm tài khoản
    if (method === "POST" && pathname === "/api/users") {
        await createUser(req, res);
        return true;
    }

    // GET, PUT, DELETE: Chi tiết tài khoản
    const detailMatch = pathname.match(
        /^\/api\/users\/([^/]+)$/
    );

    if (detailMatch && method === "GET") {
        await getUserById(req, res, detailMatch[1]);
        return true;
    }

    if (detailMatch && method === "PUT") {
        await updateUser(req, res, detailMatch[1]);
        return true;
    }

    if (detailMatch && method === "DELETE") {
        await deleteUser(req, res, detailMatch[1]);
        return true;
    }

    return false;
};

module.exports = userRoutes;
