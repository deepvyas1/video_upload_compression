"use strict"

// Module Import
const mongoose = require("mongoose");

// Internal Module Import
const sanityChecks = require("../utils/sanity");
const responseMessage = require("../utils/responseMessage");
const responseHelper = require("../utils/responseHelper");

// Config and Services import
const sseConfig = require("./sseConfig.json");

// These are SSE hashmaps for different flows.
/* Note -> Format: {userId_requestId: {timestamp: "", response: "Actual event stream object"}}*/
global.videoSSEHashMap = {};

// This is the async function to get the sse hashmap to used for the request.
function getSSEHashmapForMediaRequest(mediaType) {
    let mediaHashMap;
    switch (mediaType) {
        case sseConfig.media.types.video:
            mediaHashMap = videoSSEHashMap;
            break;
    }
    return mediaHashMap;
}

module.exports = {
    postMediaEvent: async function (req, res) {
        let response;
        const xCallerId = req.query.xcallerid || req.body.xCallerId;
        const mediaType = req.query.mtype;
        if (!sanityChecks.isValidId(xCallerId) || !mediaType || !sseConfig.media.types.values.includes(mediaType)) {
            console.log("Info ::: Missing Info ::: xCallerId" + xCallerId + ". mediaType: " + mediaType);
            response = responseMessage.incorrectPayload;
            return responseHelper(null, res, response, response.code);
        }

        const requestId = new mongoose.Types.ObjectId();

        const value = {res: res, timestamp: Date.now()};
        const mediaSSEHashMap = getSSEHashmapForMediaRequest(mediaType);
        mediaSSEHashMap[`${xCallerId + "_" + requestId}`] = value;
        const headers = {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        };
        res.writeHead(200, headers);
        res.write("data: " + `${JSON.stringify({
            requestId: requestId,
            event: sseConfig.events.connection_initiated
        })}` + '\n\n');
        // Note ::: We need to flush the response otherwise frontend will not receive data through res object.
        res.flush();
    }
}