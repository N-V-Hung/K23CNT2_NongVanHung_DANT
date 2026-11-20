
const mongoose = require("mongoose");

const maintenanceSchema = new mongoose.Schema(
    {
        deviceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Device",
            required: true
        },

        maintenanceDate: {
            type: Date,
            required: true
        },

        maintenanceType: {
            type: String,
            required: true,
            trim: true
        },

        content: {
            type: String,
            required: true,
            trim: true
        },

        cost: {
            type: Number,
            default: 0,
            min: 0
        },

        status: {
            type: String,
            required: true,
            default: "pending"
        },

        note: {
            type: String,
            default: "",
            trim: true
        }
    },
    {
        timestamps: true,
        collection: "maintenances"
    }
);

module.exports = mongoose.model(
    "Maintenance",
    maintenanceSchema
);
