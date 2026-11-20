
require("dotenv").config();

const connectDB = require("../config/database");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const resetAdminPassword = async () => {
    try {
        await connectDB();

        const email = "admin@buildtrack.com";

        const admin = await User.findOne({ email });

        if (!admin) {
            console.log("Không tìm thấy tài khoản Admin!");
            return;
        }

        // Mã hóa mật khẩu mới
        const hashedPassword = await bcrypt.hash("123456", 10);

        // Cập nhật tài khoản hiện có
        admin.password = hashedPassword;
        admin.role = "admin";
        admin.status = true;

        await admin.save();

        console.log("Cập nhật Admin thành công!");
        console.log("Email:", admin.email);
        console.log("Mật khẩu mới: 123456");
        console.log("Role:", admin.role);

    } catch (error) {
        console.error("Lỗi:", error.message);

    } finally {
        await mongoose.connection.close();
    }
};

resetAdminPassword();
