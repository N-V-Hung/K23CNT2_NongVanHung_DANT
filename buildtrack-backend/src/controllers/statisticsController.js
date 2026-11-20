
const {
    Device,
    Category,
    Maintenance,
    Assignment
} = require("../models");

// ==================================
// UC08 - THỐNG KÊ VÀ TỔNG QUAN
// ==================================
const getStatistics = async (req, res) => {
    try {
        // 1. Thống kê tổng số lượng
        const totalDevices = await Device.countDocuments();
        const totalCategories = await Category.countDocuments();
        const totalMaintenances = await Maintenance.countDocuments();
        const totalAssignments = await Assignment.countDocuments();

        // 2. Thống kê thiết bị theo trạng thái
        const devicesByStatus = await Device.aggregate([
            {
                $group: {
                    _id: "$status",
                    total: { $sum: 1 }
                }
            },
            {
                $sort: { total: -1 }
            }
        ]);

        // 3. Thống kê thiết bị theo danh mục
        const devicesByCategory = await Device.aggregate([
            {
                $lookup: {
                    from: "categories",
                    localField: "categoryId",
                    foreignField: "_id",
                    as: "category"
                }
            },
            {
                $unwind: {
                    path: "$category",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $group: {
                    _id: "$categoryId",
                    categoryName: {
                        $first: {
                            $ifNull: ["$category.name", "Chưa phân loại"]
                        }
                    },
                    total: { $sum: 1 }
                }
            },
            {
                $sort: { total: -1 }
            }
        ]);

        // 4. Thống kê bảo trì theo trạng thái
        const maintenancesByStatus = await Maintenance.aggregate([
            {
                $group: {
                    _id: "$status",
                    total: { $sum: 1 }
                }
            },
            {
                $sort: { total: -1 }
            }
        ]);

        // 5. Tổng chi phí bảo trì
        const maintenanceCost = await Maintenance.aggregate([
            {
                $group: {
                    _id: null,
                    totalCost: { $sum: "$cost" }
                }
            }
        ]);

        // 6. Thống kê phân công theo trạng thái
        const assignmentsByStatus = await Assignment.aggregate([
            {
                $group: {
                    _id: "$status",
                    total: { $sum: 1 }
                }
            },
            {
                $sort: { total: -1 }
            }
        ]);

        // 7. Trả kết quả
        return res.writeHead(200, {
            "Content-Type": "application/json; charset=utf-8"
        }), res.end(JSON.stringify({
            success: true,
            message: "Lấy thống kê tổng quan thành công",
            data: {
                overview: {
                    totalDevices,
                    totalCategories,
                    totalMaintenances,
                    totalAssignments,
                    totalMaintenanceCost:
                        maintenanceCost[0]?.totalCost || 0
                },
                devicesByStatus,
                devicesByCategory,
                maintenancesByStatus,
                assignmentsByStatus
            }
        }));

    } catch (error) {
        console.error("Get statistics error:", error);

        return res.writeHead(500, {
            "Content-Type": "application/json; charset=utf-8"
        }), res.end(JSON.stringify({
            success: false,
            message: "Không thể lấy dữ liệu thống kê"
        }));
    }
};

module.exports = {
    getStatistics
};
