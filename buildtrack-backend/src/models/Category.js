const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            default: ""
        },

        icon: {
            type: String,
            default: ""
        },

        isActive: {
            type: Boolean,
            default: true
        },

        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true
        }
    },
    {
        timestamps: true,
        collection: "categories"
    }
);

module.exports = mongoose.model("Category", categorySchema);