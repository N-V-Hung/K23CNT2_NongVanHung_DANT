const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema(
    {
        deviceCode: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true
        },

        description: {
            type: String,
            default: ""
        },

        status: {
            type: String,
            required: true,
            default: "available"
        }
    },
    {
        timestamps: true,
        collection: "devices"
    }
);

module.exports = mongoose.model("Device", deviceSchema);