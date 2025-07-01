"use strict"

const multer = require("multer");
const path = require("path");

const videoConfig = require("../video/videoConfig.json");
const awsConfig = require("../external/awsConfig.json");

const responseMessage = require("./responseMessage");

function checkFileType(fileObject, res, callback) {
    let response;
    let allowedExtensions, allowedMimetype;
    const file = fileObject.file;
    const fileMimeType = file.mimetype;
    const fileExtension = path.extname((file.originalname).toLowerCase());
    allowedExtensions = videoConfig.extensions.values;
    allowedMimetype = videoConfig.videoMimeType.values;

    // This is to check whether the provided file mimetype is allowed or not.
    if (!allowedMimetype.includes(fileMimeType)) {
        console.log("Error ::: Invalid file mimetype: " + fileMimeType);
        response = responseMessage.invalidMimeType;
        return res.status(response.code).send(response);
    } else if (!allowedExtensions.includes(fileExtension)) {
        // This is to check whether the provided file extension is allowed or not.
        console.log("Error ::: Invalid file extension: " + fileExtension);
        response = responseMessage.fileTypeNotAllowed;
        return res.status(response.code).send(response);
    } else {
        callback(null, true);
    }
}

module.exports = {

    // Middleware to make sure that the image file uploaded is valid.
    isValidVideoWithoutDiskStorage: function (req, res, next) {
        const upload = multer({
            fileFilter: function (req, file, callback) {
                const fileObject = {
                    file: file,
                    flowType: awsConfig.fileTypes.videos
                };
                checkFileType(fileObject, res, callback);
            }
        }).single(fileUploadFieldName);

        upload(req, res, (err) => {
            if (err) {
                console.log("Error ::: Video uploading process failed with error: ", JSON.stringify(err));
                const response = responseMessage.fileUploadFailed;
                return res.status(response.code).send(response);
            } else {
                next();
            }
        })
    },
};