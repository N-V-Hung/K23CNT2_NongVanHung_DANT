const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
    {
        deviceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Device",
            required: true
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        constructionSite: {
            type: String,
            required: true
        },

        siteAddress: {
            type: String,
            required: true
        },

        assignedDate: {
            type: Date,
            required: true
        },

        returnDate: {
            type: Date,
            default: null
        },

        status: {
            type: String,
            required: true,
            default: "active"
        },

        note: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true,
        collection: "assignments"
    }
);

module.exports = mongoose.model("Assignment", assignmentSchema);