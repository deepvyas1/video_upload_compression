"use strict";

// Models Imports
const Video = require("./videoModel");

// Inbuilt Model Imports
const path = require("path");
const fs = require("fs");

// Util Imports.
const responseMessage = require("../utils/responseMessage");
const sanityChecks = require("../utils/sanity");

// External Service Imports.
const awsService = require("../external/awsService");

// Config Imports
const awsConfig = require("../external/awsConfig.json");
const sseConfig = require("../sever_sent_events/sseConfig.json");

// External Modules Imports
const mongoose = require("mongoose");
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require("fluent-ffmpeg");
const ffprobePath = require("@ffprobe-installer/ffprobe").path;
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);



// This is the function to update a video.
async function updateVideoInfoAsync(query, updateObject, options) {
    let response;
    try {
        const updateVideoInfoRes = await Video.findOneAndUpdate(query, updateObject, options)
        if (updateVideoInfoRes) {
            response = new responseMessage.GenericSuccessMessage();
            response.data = {videoDetails: updateVideoInfoRes};
            return response;
        } else {
            response = new responseMessage.ObjectDoesNotExistInDB();
            return response;
        }
    } catch (err) {
        console.log("Error ::: found in updateVideoInfoAsync, error: " + JSON.stringify(err));
        console.log(`ERROR ::: error: ${err.message}, stack: ${err.stack}`);
        response = new responseMessage.ErrorInQueryingDB();
        return response;
    }
}

//This is the function to delete the files written on the disk.
function deleteFileFromDisk(filePath, fileName) {
    // Deleting the files written in the disk.
    fs.unlink((filePath), (err) => {
        if (err) {
            console.log(`Error ::: While deleting video file: ${fileName}`, err);
        } else {
            console.log(`Info ::: Success ::: Video file with name ${fileName} from the disk has been deleted successfully`);
        }
    });
}

module.exports = {

    // This is the service for uploading single video to S3 with server sent events.
    postSingleVideoWithSSEWithWorkerPool: async function (req, callback) {
        console.log("Info ::: body received in postSingleVideoWithSSEWithWorkerPool: " + JSON.stringify(req.body));
        let response;

        const body = req.body;
        const file = req.file;
        const requestId = body.requestId;
        const userId = body.userId;
        const userName = body.userName;

        if (!sanityChecks.isValidId(requestId) || !sanityChecks.isValidId(userId) || !userName || !file) {
            console.log("Info ::: Missing info in postSingleVideoWithSSEWithWorkerPool ::: userId: " + userId +
                ". userName: " + userName + ". file: " + file);
            response = responseMessage.incorrectPayload;
            return callback(null, response, response.code);
        }

        // Check if the requestId is valid and the same user has created the request.
        const isRequestValid = videoSSEHashMap[`${userId + "_" + requestId}`];
        const originalFilePath = path.resolve(`${__dirname}`, `../../assets/video/${file.filename}`);
        const originalFileName = `${file.filename}`;
        if (isRequestValid) {
            const createdBy = {userId: userId, userName: userName};
            const insertObject = {
                uploadedBy: createdBy,
                mimeType: file.mimetype,
                encoding: file.encoding,
                extension: path.extname(file.originalname).toLowerCase(),
                requestId: requestId
            };
            const workerBody = {
                workerData: {
                    file: file,
                    userId: userId,
                    requestId: requestId
                }
            };
            try {
                const saveVideoRes = await Video.create(insertObject);
                if (saveVideoRes) {
                    // This is the case when the video is successfully saved.
                    // Now we are going to compress the video using a worker thread
                    // We need to convert the ID being returned to string as the data returned in Mongodb's ObjectId ( Ie type [object object] )
                    workerBody.workerData.mediaId = saveVideoRes._id.toString();

                    // Here, we are passing the video to the worker pool for the compression
                    videoImageWorkerPool.exec("compressVideo", [workerBody.workerData], {
                        on: payload => {
                            if (sanityChecks.isObjectValid(payload) && payload.progress) {
                                isRequestValid.res.write("data: " + `${JSON.stringify({
                                    event: sseConfig.events.media_compression_progress,
                                    progress: payload.progress.percent,
                                    progressType: sseConfig.progress.type.compression,
                                    mediaId: saveVideoRes._id.toString()
                                })}` + '\n\n');

                                // Note ::: We need to flush the response otherwise frontend will not receive data through res object.
                                isRequestValid.res.flush();
                            }
                            console.log("Info ::: Video and Image worker pool stats: ", videoImageWorkerPool.stats()); // For testing purpose
                        }
                    }).then((compressedFileRes) => {
                        if (compressedFileRes && compressedFileRes.code === 200 && compressedFileRes.status === "success") {
                            const compressedFilePath = path.resolve(`${__dirname}`, `../../assets/video/compressed_${file.filename}`);
                            const compressedFileName = `compressed_${file.filename}`;
                            // Here we are reading the compressed file.
                            fs.readFile(path.resolve(`${__dirname}`, `../../assets/video/compressed_${file.filename}`), (err, data) => {
                                if (err) {
                                    console.log("Error ::: Error while reading the compressed file: ", err);
                                    response = new responseMessage.ErrorInQueryingDB();
                                    isRequestValid.res.write("data: " + `${JSON.stringify({uploadedMediaInfo: response})}` + '\n\n');
                                    isRequestValid.res.flush();
                                    delete videoSSEHashMap[`${userId + "_" + requestId}`];
                                    isRequestValid.res.end(); // Ending the request.
                                    // This is to delete the files on the disk.
                                    deleteFileFromDisk(compressedFilePath, compressedFileName);
                                    deleteFileFromDisk(originalFilePath, originalFileName);
                                } else {
                                    const videoMetaData = {
                                        mimetype: file.mimetype,
                                        buffer: data,
                                        originalname: file.originalname + "_compressed" + path.extname(file.originalname),
                                        encoding: file.encoding
                                    };
                                    const videoUploadS3Object = {
                                        params: awsService.getAwsSingleUploadParams({
                                            flowType: awsConfig.fileTypes.videos,
                                            file: videoMetaData
                                        }),
                                        userId: userId,
                                        requestId: requestId,
                                        flowType: sseConfig.media.types.video,
                                        mediaId: saveVideoRes._id
                                    };

                                    // This is to upload video file to S3 with server sent events.
                                    awsService.callSingleFileUploadFromSSE(videoUploadS3Object, async (err, awsDataRes) => {
                                        if (err) {
                                            // This is the case when some error occurred while uploading files to S3.
                                            response = new responseMessage.GenericFailureMessage();
                                            isRequestValid.res.write("data: " + `${JSON.stringify({uploadedMediaInfo: response})}` + '\n\n');
                                            isRequestValid.res.flush();
                                            delete videoSSEHashMap[`${userId + "_" + requestId}`];
                                            isRequestValid.res.end(); // Ending the request.
                                            // This is to delete the files on the disk.
                                            deleteFileFromDisk(compressedFilePath, compressedFileName);
                                            deleteFileFromDisk(originalFilePath, originalFileName);
                                        } else {
                                            // Getting details of s3 uploaded video file.
                                            const awsS3Object = {
                                                key: awsDataRes.Key,
                                                s3Url: awsDataRes.Location,
                                                etag: awsDataRes.ETag.slice(1, -1),
                                                bucketName: awsDataRes.Bucket,
                                                cfUrl: cfImageUrl + awsDataRes.Key
                                            };

                                            // This is to calculate the details of the video file
                                            ffmpeg.ffprobe(awsS3Object.cfUrl, async (err, fileMetaData) => {
                                                if (err) {
                                                    delete videoSSEHashMap[`${userId + "_" + requestId}`];
                                                    isRequestValid.res.end(); // Ending the request.
                                                    console.log("Error ::: postSingleVideoWithSSE failed with error: ", err);
                                                    // Deleting the temporary compressed file created in assets folder
                                                    // This is to delete the files on the disk.
                                                    deleteFileFromDisk(compressedFilePath, compressedFileName);
                                                    deleteFileFromDisk(originalFilePath, originalFileName);
                                                } else {
                                                    const fileData = fileMetaData.streams[0];
                                                    const query = {_id: mongoose.Types.ObjectId(awsDataRes.mediaId)};
                                                    const updateObject = {
                                                        bitrate: fileData.bit_rate,
                                                        frameRateFps: fileData.nb_frames,
                                                        duration: fileData.duration,
                                                        size: fileMetaData.format.size,
                                                        videoInfo: awsS3Object,
                                                        fileName: (awsS3Object.key.split("/"))[1],
                                                        width: fileData.width,
                                                        height: fileData.height,
                                                        aspectRatio: fileData.display_aspect_ratio
                                                    };
                                                    const options = {new: true, runValidators: true};
                                                    const updateVideoInfoRes = await updateVideoInfoAsync(query, updateObject, options);
                                                    if (updateVideoInfoRes && updateVideoInfoRes.code === 200 && updateVideoInfoRes.status === "success") {
                                                        console.log(`Info ::: Success ::: Video updated successfully`, JSON.stringify(updateVideoInfoRes));
                                                        response = new responseMessage.GenericSuccessMessage();
                                                        response.event = sseConfig.events.media_uploaded;
                                                        response.data = {
                                                            videoId: updateVideoInfoRes.data.videoDetails._id,
                                                            videoCfUrl: updateVideoInfoRes.data.videoDetails.videoInfo.cfUrl,
                                                            videoS3Url: updateVideoInfoRes.data.videoDetails.videoInfo.s3Url
                                                        };

                                                        isRequestValid.res.write("data: " + `${JSON.stringify({
                                                            uploadedMediaInfo: response,
                                                            event: sseConfig.events.media_uploaded
                                                        })}` + '\n\n');

                                                        isRequestValid.res.flush();
                                                        delete videoSSEHashMap[`${userId + "_" + requestId}`];
                                                        isRequestValid.res.end(); // Ending the request.
                                                        // Deleting the temporary compressed file created in assets folder
                                                        // This is to delete the files on the disk.
                                                        deleteFileFromDisk(compressedFilePath, compressedFileName);
                                                        deleteFileFromDisk(originalFilePath, originalFileName);
                                                    } else {
                                                        console.log(`Info ::: Failure ::: Video could not be uploaded`);
                                                        response = new responseMessage.GenericFailureMessage();
                                                        isRequestValid.res.write("data: " + `${JSON.stringify({uploadedMediaInfo: response})}` + '\n\n');
                                                        isRequestValid.res.flush();
                                                        delete videoSSEHashMap[`${userId + "_" + requestId}`];
                                                        isRequestValid.res.end(); // Ending the request.
                                                        // This is to delete the files on the disk.
                                                        deleteFileFromDisk(compressedFilePath, compressedFileName);
                                                        deleteFileFromDisk(originalFilePath, originalFileName);
                                                    }
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        } else {
                            // This is to delete the files on the disk.
                            deleteFileFromDisk(originalFilePath, originalFileName);
                            console.log("Info ::: createThreadsAsync in postSingleVideoWithSSE failed with data: ", JSON.stringify(compressedFileRes));
                            return callback(null, compressedFileRes, compressedFileRes.code);
                        }
                    }).catch(err => {
                        // This is to delete the files on the disk.
                        deleteFileFromDisk(originalFilePath, originalFileName);
                        isRequestValid.res.end(); // Ending the request.
                        console.log("ERROR ::: found in postSingleVideoWithSSEWithWorkerPool, error: " + JSON.stringify(err));
                        console.log(`ERROR ::: error: ${err.message}, stack: ${err.stack}`);
                        response = new responseMessage.ErrorInQueryingDB();
                        return callback(null, response, response.code);
                    });
                    response = new responseMessage.GenericSuccessMessage();
                    response.data = {mediaId: saveVideoRes._id};
                    return callback(null, response, response.code);
                } else {
                    // This is to delete the files on the disk.
                    deleteFileFromDisk(originalFilePath, originalFileName);
                    isRequestValid.res.end(); // Ending the request.
                    response = new responseMessage.GenericFailureMessage();
                    delete videoSSEHashMap[`${userId + "_" + requestId}`];
                    return callback(null, response, response.code);
                }
            } catch (err) {
                // This is to delete the files on the disk.
                deleteFileFromDisk(originalFilePath, originalFileName);
                delete videoSSEHashMap[`${userId + "_" + requestId}`];
                isRequestValid.res.end(); // Ending the request.
                console.log("ERROR ::: found in postSingleVideoWithSSE, error: " + JSON.stringify(err));
                console.log(`ERROR ::: error: ${err.message}, stack: ${err.stack}`);
                response = new responseMessage.ErrorInQueryingDB();
                return callback(null, response, response.code);
            }
        } else {
            // This is the case when the request is not valid.
            // This is to delete the files on the disk.
            deleteFileFromDisk(originalFilePath, originalFileName);
            isRequestValid.res.end(); // Ending the request.
            response = responseMessage.incorrectPayload;
            return callback(null, response, response.code);
        }
    },
}
