"use strict";

// Third Party Module Imports.
const mongoose = require("mongoose");

// Internal Model Imports.
const AwsS3Upload = require("../models/awsModel").AwsS3Upload;
const User = require("../models/userInfoSchema").User;

// Config Imports.
const videoConfig = require("./videoConfig.json");


const videoSchema = new mongoose.Schema({
    bitrate: {
        type: Number
    },
    frameRateFps: {
        type: Number
    },
    uploadedBy: {
        type: User,
        required: [true, "Video uploaded by is required"]
    },
    mimeType: {
        type: String,
        required: [true, "Video Mimetype is required"],
        enum: videoConfig.videoMimeType.values
    },
    encoding: {
        type: String,
        required: [true, "Video encoding is required"]
    },
    duration: {
        type: Number, //in seconds
    },
    size: {
        type: Number,
    },
    videoInfo: {
        type: AwsS3Upload
    },
    fileName: {
        type: String
    },
    extension: {
        type: String,
        enum: videoConfig.extensions.values
    },
    captions: {},
    width: {
        type: Number
    },
    height: {
        type: Number
    },
    aspectRatio: {
        type: String
    },
    status: {
        type: String,
        default: videoConfig.status.active,
        enum: videoConfig.status.values
    },
    requestId: {
        type: mongoose.Schema.Types.ObjectId
    }
}, {
    timestamps: true
});

videoSchema.index({"uploadedBy.userId": 1});

module.exports = mongoose.mainConnection.model("PostVideo", videoSchema, "post_videos");