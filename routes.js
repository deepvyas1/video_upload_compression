"use strict";

// Route Imports.
const videoSSERoute = require("./server/video/videoRoute").videoSSERouter;

const sseRoute = require("./server/sever_sent_events/sseRoute").sseRouter;


// Middleware Imports
const isValidVideo = require("./server/utils/middlewares").isValidVideo;

module.exports = function (app) {

    app.use("/v1/api/user/video/sse", [isValidVideo], videoSSERoute);

    app.use("/v1/api/user/sse",  sseRoute);

};
