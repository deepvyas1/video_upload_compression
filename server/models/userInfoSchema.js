"use strict";
const mongoose = require("mongoose");

const userInfoSchema = new mongoose.Schema({
    _id: false,
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "userId is required"],
    },
    userName: {
        type: String,
        required: [true, "url is required"]
    }
});

module.exports = {
    User: userInfoSchema
}