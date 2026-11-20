
const {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
} = require("../controllers/categoryController");

const {
    authenticate,
    authorize
} = require("../middleware/authMiddleware");

const categoryRoutes = async (req, res) => {
    const method = req.method;

    const pathname = new URL(
        req.url,
        "http://localhost"
    ).pathname;

    const detailMatch = pathname.match(
        /^\/api\/categories\/([^/]+)$/
    );

    const isCategoryRoute =
        pathname === "/api/categories" ||
        detailMatch !== null;

    if (!isCategoryRoute) {
        return false;
    }

    // Xác thực đăng nhập
    const user = await authenticate(req, res);

    if (!user) {
        return true;
    }

    // UC03: Chỉ Admin được quản lý danh mục
    if (!authorize(user, ["admin"], res)) {
        return true;
    }

    // GET: Danh sách danh mục
    if (method === "GET" && pathname === "/api/categories") {
        await getCategories(req, res);
        return true;
    }

    // POST: Thêm danh mục
    if (method === "POST" && pathname === "/api/categories") {
        await createCategory(req, res);
        return true;
    }

    // GET: Chi tiết danh mục
    if (detailMatch && method === "GET") {
        await getCategoryById(req, res, detailMatch[1]);
        return true;
    }

    // PUT: Cập nhật danh mục
    if (detailMatch && method === "PUT") {
        await updateCategory(req, res, detailMatch[1]);
        return true;
    }

    // DELETE: Xóa danh mục
    if (detailMatch && method === "DELETE") {
        await deleteCategory(req, res, detailMatch[1]);
        return true;
    }

    return false;
};

module.exports = categoryRoutes;
