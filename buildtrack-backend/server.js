
require("dotenv").config();

const http = require("http");
const connectDB = require("./src/config/database");
const models = require("./src/models");

// Import Routes
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
const categoryRoutes = require("./src/routes/categoryRoutes");
const deviceRoutes = require("./src/routes/deviceRoutes");
const assignmentRoutes = require("./src/routes/assignmentRoutes");
const maintenanceRoutes = require("./src/routes/maintenanceRoutes");
const statisticsRoutes = require("./src/routes/statisticsRoutes");

const PORT = process.env.PORT || 5000;


const server = http.createServer(async (req, res) => {
    console.log("REQUEST RECEIVED:", req.method, req.url);

    // Cấu hình CORS cho ReactJS
    res.setHeader(
        "Access-Control-Allow-Origin",
        "http://localhost:3000"
    );

    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
    );

    res.setHeader(
        "Content-Type",
        "application/json; charset=utf-8"
    );

    // Xử lý yêu cầu kiểm tra CORS
    if (req.method === "OPTIONS") {
        res.writeHead(204);
        return res.end();
    }

    try {

        // 1. Kiểm tra Backend
        if (
            req.method === "GET" &&
            req.url === "/api/health"
        ) {
            res.writeHead(200);

            return res.end(JSON.stringify({
                success: true,
                message: "BuildTrack Backend is running!",
                database: "MongoDB"
            }));
        }

        // 2. Auth Routes
        const authHandled = await authRoutes(req, res);
        console.log("Auth handled:", authHandled);

        if (authHandled !== false) return;

        // 3. User Routes
        const userHandled = await userRoutes(req, res);
        console.log("User handled:", userHandled);

        if (userHandled !== false) return;

        // 4. Category Routes
        const categoryHandled = await categoryRoutes(req, res);
        console.log("Category handled:", categoryHandled);

        if (categoryHandled !== false) return;

        // 5. Device Routes
        const deviceHandled = await deviceRoutes(req, res);
        console.log("Device handled:", deviceHandled);

        if (deviceHandled !== false) return;

        // 6. Assignment Routes
        console.log(">>> SERVER ĐANG GỌI ASSIGNMENT ROUTES <<<");

        const assignmentHandled = await assignmentRoutes(req, res);
        console.log("Assignment handled:", assignmentHandled);

        if (assignmentHandled !== false) return;

        // 7. Maintenance Routes
        const maintenanceHandled = await maintenanceRoutes(req, res);

        if (maintenanceHandled !== false) {
            return;
        }

        // 8. Statistics Routes     
        const statisticsHandled = await statisticsRoutes(req, res);

        if (statisticsHandled !== false) {
            return;
        }

        // . API không tồn tại
        res.writeHead(404);

        return res.end(JSON.stringify({
            success: false,
            message: "API not found"
        }));

    } catch (error) {
        console.error("Server error:", error);

        if (!res.headersSent) {
            res.writeHead(500);

            res.end(JSON.stringify({
                success: false,
                message: "Internal Server Error"
            }));
        }
    }
});

// Khởi động Server
const startServer = async () => {
    try {
        await connectDB();

        console.log(
            "BuildTrack Models loaded:",
            Object.keys(models)
        );

        server.listen(PORT, () => {
            console.log("--------------------------------");
            console.log("BuildTrack Backend is running!");
            console.log(`URL: http://localhost:${PORT}`);
            console.log("--------------------------------");
        });

    } catch (error) {
        console.error("Server startup failed:", error);
        process.exit(1);
    }
};

startServer();
