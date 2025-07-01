"use strict";

// Route Imports.
const videoSSEV2Route = require("./server/video/videoRoute").videoSSEV2Router;

// Middleware Imports
const isValidVideoWithoutDiskStorage = require("./server/utils/middlewares").isValidVideoWithoutDiskStorage;

module.exports = function (app) {

    app.use("/v2/api/user/video/sse", [isValidVideoWithoutDiskStorage], videoSSEV2Route);

    app.use("/v2/api/sse",  sseV2Route);

};
