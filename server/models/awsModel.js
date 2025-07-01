"use strict";
const mongoose = require("mongoose");

const awsS3Schema = new mongoose.Schema({
    _id: false,
    bucketName: {
        type: String,
        required: [true, "Bucket name is required"],
    },
    s3Url: {
        type: String,
        required: [true, "url is required"]
    },
    etag: {
        type: String,
        required: [true, "ETag is required"]
    },
    key: {
        type: String,
        required: [true, "file key is required"]
    },
    cfUrl: {
        type: String,
        required: [true, "cfUrl is required"]
    }
});

module.exports = {
    AwsS3Upload: awsS3Schema
}