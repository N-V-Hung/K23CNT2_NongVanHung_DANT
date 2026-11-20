
const Category = require("../models/Category");
const mongoose = require("mongoose");

// Hàm đọc JSON từ Request
const getBody = (req) => {
    return new Promise((resolve, reject) => {
        let body = "";

        req.on("data", chunk => {
            body += chunk;

            if (body.length > 1024 * 1024) {
                reject(new Error("Dữ liệu quá lớn"));
                req.destroy();
            }
        });

        req.on("end", () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch {
                reject(new Error("JSON không hợp lệ"));
            }
        });

        req.on("error", reject);
    });
};

// Hàm trả kết quả JSON
const response = (res, status, data) => {
    res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8"
    });

    res.end(JSON.stringify(data));
};

// 1. LẤY DANH SÁCH DANH MỤC
const getCategories = async (req, res) => {
    try {
        const categories = await Category.find()
            .sort({ createdAt: -1 });

        return response(res, 200, {
            success: true,
            total: categories.length,
            data: categories
        });

    } catch (error) {
        console.error("Get categories error:", error);

        return response(res, 500, {
            success: false,
            message: "Không thể lấy danh sách danh mục"
        });
    }
};

// 2. XEM CHI TIẾT DANH MỤC
const getCategoryById = async (req, res, id) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return response(res, 400, {
                success: false,
                message: "ID danh mục không hợp lệ"
            });
        }

        const category = await Category.findById(id);

        if (!category) {
            return response(res, 404, {
                success: false,
                message: "Không tìm thấy danh mục"
            });
        }

        return response(res, 200, {
            success: true,
            data: category
        });

    } catch (error) {
        console.error("Get category error:", error);

        return response(res, 500, {
            success: false,
            message: "Không thể lấy thông tin danh mục"
        });
    }
};

// 3. THÊM DANH MỤC
const createCategory = async (req, res) => {
    try {
        const { name, description, icon, slug } =
            await getBody(req);

        if (
            typeof name !== "string" ||
            !name.trim() ||
            typeof slug !== "string" ||
            !slug.trim()
        ) {
            return response(res, 400, {
                success: false,
                message: "Tên và slug danh mục không được để trống"
            });
        }

        const normalizedSlug = slug.trim().toLowerCase();

        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedSlug)) {
            return response(res, 400, {
                success: false,
                message: "Slug chỉ được chứa chữ thường, số và dấu gạch ngang"
            });
        }

        const existingCategory = await Category.findOne({
            $or: [
                { name: name.trim() },
                { slug: normalizedSlug }
            ]
        });

        if (existingCategory) {
            return response(res, 409, {
                success: false,
                message: "Tên hoặc slug danh mục đã tồn tại"
            });
        }

        const category = await Category.create({
            name: name.trim(),
            description: description || "",
            icon: icon || "",
            slug: normalizedSlug,
            isActive: true
        });

        return response(res, 201, {
            success: true,
            message: "Thêm danh mục thành công",
            data: category
        });

    } catch (error) {
        console.error("Create category error:", error);

        if (error.code === 11000) {
            return response(res, 409, {
                success: false,
                message: "Slug danh mục đã tồn tại"
            });
        }

        return response(res, 500, {
            success: false,
            message: "Không thể thêm danh mục"
        });
    }
};

// 4. CẬP NHẬT DANH MỤC
const updateCategory = async (req, res, id) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return response(res, 400, {
                success: false,
                message: "ID danh mục không hợp lệ"
            });
        }

        const category = await Category.findById(id);

        if (!category) {
            return response(res, 404, {
                success: false,
                message: "Không tìm thấy danh mục"
            });
        }

        const body = await getBody(req);
        const { name, description, icon, slug, isActive } = body;

        if (name !== undefined) {
            if (typeof name !== "string" || !name.trim()) {
                return response(res, 400, {
                    success: false,
                    message: "Tên danh mục không hợp lệ"
                });
            }

            category.name = name.trim();
        }

        if (description !== undefined) {
            category.description = description;
        }

        if (icon !== undefined) {
            category.icon = icon;
        }

        if (slug !== undefined) {
            if (
                typeof slug !== "string" ||
                !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim().toLowerCase())
            ) {
                return response(res, 400, {
                    success: false,
                    message: "Slug không hợp lệ"
                });
            }

            category.slug = slug.trim().toLowerCase();
        }

        if (isActive !== undefined) {
            if (typeof isActive !== "boolean") {
                return response(res, 400, {
                    success: false,
                    message: "Trạng thái không hợp lệ"
                });
            }

            category.isActive = isActive;
        }

        await category.save();

        return response(res, 200, {
            success: true,
            message: "Cập nhật danh mục thành công",
            data: category
        });

    } catch (error) {
        console.error("Update category error:", error);

        if (error.code === 11000) {
            return response(res, 409, {
                success: false,
                message: "Slug danh mục đã tồn tại"
            });
        }

        return response(res, 500, {
            success: false,
            message: "Không thể cập nhật danh mục"
        });
    }
};

// 5. XÓA DANH MỤC
const deleteCategory = async (req, res, id) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return response(res, 400, {
                success: false,
                message: "ID danh mục không hợp lệ"
            });
        }

        const category = await Category.findById(id);

        if (!category) {
            return response(res, 404, {
                success: false,
                message: "Không tìm thấy danh mục"
            });
        }

        await Category.findByIdAndDelete(id);

        return response(res, 200, {
            success: true,
            message: "Xóa danh mục thành công"
        });

    } catch (error) {
        console.error("Delete category error:", error);

        return response(res, 500, {
            success: false,
            message: "Không thể xóa danh mục"
        });
    }
};

module.exports = {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};
