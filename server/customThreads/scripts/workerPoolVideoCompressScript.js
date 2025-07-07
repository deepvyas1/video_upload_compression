"use strict";

/* ------------ Inbuilt Module Imports -------- */
const path = require("path");

/* ----------- External Module Imports ------- */
const workerpool = require("workerpool");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);
const ffprobePath = require("@ffprobe-installer/ffprobe").path;
ffmpeg.setFfprobePath(ffprobePath);

/* -------------- Utils Imports ----------------- */
const sanityChecks = require("../../utils/sanity");
const responseMessage = require("../../utils/responseMessage");

/* -------------- Config Imports --------------- */
const videoConfig = require("../../video/videoConfig.json");

function getVideoDuration(filePath) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) return reject(err);
            resolve(metadata.format.duration); // duration in seconds
        });
    });
}

function parseTimemark(timemark) {
    const [h, m, s] = timemark.split(':');
    return parseFloat(h) * 3600 + parseFloat(m) * 60 + parseFloat(s);
}


// This is the function to compress the video.
async function compressVideo(body) {
    let response;
    const file = body.file;
    const requestId = body.requestId;
    const userId = body.userId;
    const mediaId = body.mediaId;
    console.log("Info ::: video received for compression");

    if (!file || !sanityChecks.isValidId(userId) || !sanityChecks.isValidId(requestId) || !sanityChecks.isValidId(mediaId)) {
        console.log("Info ::: Missing Info in compressVideoScript ::: file: " + file + ". userId: " + userId + ". requestId: "
            + requestId + ". mediaId: " + mediaId);
        response = responseMessage.incorrectPayload;
        return new Promise(resolve => resolve(response));
    }


    const getVideoDurationInSeconds = await getVideoDuration(file.path);

    // Here we are compressing the quality of the file to 1024k bitrate.
    return new Promise(resolve => {
        ffmpeg().input(path.resolve(`${file.path}`)) // Here file.path refers to the file uploaded in the assets folder before compression.
            .videoCodec(videoConfig.codecs.default) // Here we are giving videCodec for reducing the size ( defaults to x264 for lossless compression )
            .videoBitrate(videoConfig.bitrates.default) // Here, we are giving the desired the bitrate of the compressed video to reduce the size and maintain the quality.
            .addOption(["-preset", "ultrafast"]) // Adding the preset for lossless fast compression
            .output(path.resolve(`${__dirname}`, `../../../assets/video/compressed_${file.filename}`))
            .on('end', function () {
                console.log("Info ::: video compression completed");
                response = new responseMessage.GenericSuccessMessage();
                return resolve(response);
            })
            .on('error', function (err, stdout, stderr) {
                console.log("Error ::: Error while compressing the video in compressVideoScript11: ", err, stdout, stderr);
                response = new responseMessage.ErrorInQueryingDB();
                return resolve(response);
            })
            .on('progress', (progress) => {
                const current = parseTimemark(progress.timemark);
                console.log(current, getVideoDurationInSeconds);
                const percent = Math.min((current / getVideoDurationInSeconds) * 100, 100).toFixed(2);
                workerpool.workerEmit({progress: percent});
            })
            .run();
    }).catch(err => {
        console.log("Error ::: found in compressVideo in workerPoolVideoCompressScript, error: " + JSON.stringify(err));
        console.log(`ERROR ::: error: ${err.message}, stack: ${err.stack}`);
        response = new responseMessage.ErrorInQueryingDB();
        return new Promise(resolve => resolve(response));
    });
}

workerpool.worker({
    compressVideo: compressVideo
});
