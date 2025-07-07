"use strict";

/* ------------- Util Imports -----------*/
const responseHelper = require("../utils/responseHelper");

/* ------------ Internal Service Imports ---------- */
const videoService = require("./videoService");

module.exports = {

    postSingleVideoWithSSE: function (req, res) {
        videoService.postSingleVideoWithSSEWithWorkerPool(req, function (err, data, statusCode) {
            responseHelper(err, res, data, statusCode);
        })
    }
}