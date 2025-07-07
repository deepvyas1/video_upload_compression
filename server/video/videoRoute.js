"use strict";

const express = require("express");
const videoSSERouter = express.Router();

const videoController = require("./videoController");

videoSSERouter.post("/upload", (req, res) => {
    videoController.postSingleVideoWithSSE(req, res);
});

module.exports = {
    videoSSERouter: videoSSERouter,
}
