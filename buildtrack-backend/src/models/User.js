const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },

        password: {
            type: String,
            required: true,
            select: false
        },

        fullName: {
            type: String,
            required: true,
            trim: true
        },

        role: {
            type: String,
            required: true,
            default: "user"
        },

        status: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true,
        collection: "users"
    }
);

module.exports = mongoose.model("User", userSchema);