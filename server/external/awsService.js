"use strict";

const AWS = require('aws-sdk');
const awsConfig = require("./awsConfig.json");
const path = require("path");
const responseMessage = require("../utils/responseMessage");
const sseConfig = require("../sever_sent_events/sseConfig.json");
const sanityChecks = require("../utils/sanity");

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

// This is the function to get the bucket name based on flowType.
function getBucketNameBasedOnFlowType(flowType) {
    let bucket;
    switch (flowType) {
        case `${awsConfig.fileTypes.videos}`:
            bucket = awsVideoBucket;
            break;
        default:
            console.log("Info ::: Invalid flowType in getBucketNameBasedOnFlowType: ", flowType);
    }
    return bucket;
}

const s3 = new AWS.S3({
    accessKeyId: awsS3AccessKey,
    secretAccessKey: awsS3SecretAccessKey
});

function uploadFile(params, callback) {
    let response;
    s3.upload(params, function (s3Err, data) {
        if (s3Err) {
            console.log("Error ::: S3 upload failed with error: ", JSON.stringify(s3Err));
            response = new responseMessage.ErrorInQueryingDB();
            return callback(response, null);
        }
        return callback(null, data);
    });
}

function uploadFileWithProgress(body, callback) {
    let response;
    s3.upload(body.params, function (s3Err, data) {
        if (s3Err) {
            console.log("Error ::: S3 upload failed with error: ", s3Err);
            response = new responseMessage.ErrorInQueryingDB();
            response.data = {mediaId: body.mediaId}; // To identify which file upload failed.
            return callback(null, response);
        }
        data.mediaId = body.mediaId;
        return callback(null, data);
    }).on("httpUploadProgress", async (progress) => {
        const getRequestInfoRes = getSSEHashmapForMediaRequest(body.flowType);
        if (getRequestInfoRes && Object.keys(getRequestInfoRes).length > 0 && getRequestInfoRes[`${body.userId + "_" + body.requestId}`]) {
            const res = getRequestInfoRes[`${body.userId + "_" + body.requestId}`].res;
            const uploadPercentage = progress.loaded / progress.total * 100;
            res.write("data: " + `${JSON.stringify({
                event: sseConfig.events.media_upload_progress,
                progress: uploadPercentage,
                progressType: sseConfig.progress.type.upload,
                mediaId: body.mediaId
            })}` + '\n\n');
            // Note ::: We need to flush the response otherwise frontend will not receive data through res object.
            res.flush();
        } else {
            console.log("Info ::: Could not find response object for progress in uploadFileWithProgress");
        }
    });
}

// We can add cache-control in params
// This is to generate parameter for files upload for S3. ( For internal use only )
function getParamsForSingleFile(body) {
    let params;

    const mediaType = body.mediaType;
    const file = body.file;
    const uploadType = body.uploadType;
    const flow = body.flow;
    const flowId = body.flowId;
    const flowType = body.flowType

    if (!sanityChecks.isValidNonEmptyString(mediaType) || !file) {
        console.log("Info ::: Missing Info  in getParamsForSingleFile ::: file: " + file + ". mediaType: " + mediaType);
        return {};
    }
    params = {
        Bucket: getBucketNameBasedOnFlowType(mediaType),
        ContentType: file.mimetype,
        Body: file.buffer
    };

    switch (mediaType) {
        case `${awsConfig.fileTypes.videos}`:
            params.Key = awsConfig.folderName.video + Date.now() + '_' + nanoId() + path.extname(file.originalname.toLowerCase());
            break;
        default:
            console.log("Info ::: Invalid mediaType in getParamsForSingleFile: ", mediaType);
            params = {};
    }
    return params;
}

module.exports = {

    getAwsSingleUploadParams: function (body) {
        const getAwsUploadParamsBody = {
            mediaType: body.flowType,
            file: body.file,
            uploadType: body.uploadType,
            flowId: body.flowId,
            flowType: body.postType,
            flow: body.flow
        };
        return getParamsForSingleFile(getAwsUploadParamsBody);
    },

    // This is to upload single file to S3.
    callSingleFileUploadFromSSE: function (body, callback) {
        let response;
        const params = body.params;
        const userId = body.userId;
        const requestId = body.requestId;
        const flowType = body.flowType;
        if (!params || !userId || !requestId || !flowType) {
            console.log("Info ::: Missing Info ::: params: " + JSON.stringify(params) + ". userId: " + userId + ". requestId: " + requestId + ". flowType: " + flowType);
            response = responseMessage.incorrectPayload;
            return callback(null, response);
        }
        uploadFileWithProgress(body, callback);
    }
}

