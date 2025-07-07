"use strict";

const {customAlphabet} = require('nanoid');
const developmentConfig = require('../environment/development.json');

const environment = process.env.NODE_ENV;
let mongoMainHost, mongoMainDB, mongoMainUser, mongoMainPass;
let awsS3AccessKey, awsS3SecretAccessKey, nanoId;
let  awsMediaVideoBucket, fileUploadFieldName;
let mainThreadMemoryPercent, maxWorkerThreadCount, awsMediaVideoCloudFront;

// All prod config removed from local config files
if (environment === "production") {
    const mongoMainHostStr = process.env.PROD_MONGO_MAIN_HOST;
    mongoMainHost = mongoMainHostStr.split(",");
    mongoMainDB = process.env.PROD_MONGO_MAIN_DB;
    mongoMainUser = process.env.PROD_MONGO_USERNAME;
    mongoMainPass = process.env.PROD_MONGO_PASSWORD;

    awsS3AccessKey = process.env.PROD_AWS_ACCESS_KEY_ID;
    awsS3SecretAccessKey = process.env.PROD_AWS_SECRET_ACCESS_KEY;
    awsMediaVideoBucket = process.env.PROD_AWS_MEDIA_VIDEO_BUCKET;
    awsMediaVideoCloudFront = process.env.PROD_AWS_MEDIA_VIDEO_CLOUDFRONT;
    fileUploadFieldName = process.env.PROD_UPLOAD_FILE_NAME;
    mainThreadMemoryPercent = process.env.PROD_MAIN_THREAD_MEMORY_PERCENT;
    maxWorkerThreadCount = process.env.PROD_MAX_WORKER_THREAD_COUNT;

    nanoId = customAlphabet(process.env.PROD_NANOID_CHARACTERS,
        parseInt(process.env.STAGE_NANOID_LENGTH, 10));

} else if (environment === "staging") {

    const mongoMainHostStr = process.env.STAGE_MONGO_MAIN_HOST;
    mongoMainHost = mongoMainHostStr.split(",");
    mongoMainDB = process.env.STAGE_MONGO_MAIN_DB;
    mongoMainUser = process.env.STAGE_MONGO_USERNAME;
    mongoMainPass = process.env.STAGE_MONGO_PASSWORD;

    awsS3AccessKey = process.env.STAGE_AWS_ACCESS_KEY_ID;
    awsS3SecretAccessKey = process.env.STAGE_AWS_SECRET_ACCESS_KEY;
    awsMediaVideoBucket = process.env.STAGE_AWS_MEDIA_VIDEO_BUCKET;
    awsMediaVideoCloudFront = process.env.STAGE_AWS_MEDIA_VIDEO_CLOUDFRONT;
    fileUploadFieldName = process.env.STAGE_UPLOAD_FILE_NAME;
    mainThreadMemoryPercent = process.env.STAGE_MAIN_THREAD_MEMORY_PERCENT;
    maxWorkerThreadCount = process.env.STAGE_MAX_WORKER_THREAD_COUNT;

    nanoId = customAlphabet(process.env.STAGE_NANOID_CHARACTERS,
        parseInt(process.env.STAGE_NANOID_LENGTH, 10));
} else {
    mongoMainHost = developmentConfig.dbCredentials.mongo.host;
    mongoMainDB = developmentConfig.dbCredentials.mongo.mongo_db;
    mongoMainUser = developmentConfig.dbCredentials.mongo.username;
    mongoMainPass = developmentConfig.dbCredentials.mongo.password;

    awsS3AccessKey = developmentConfig.awsS3.accessKey;
    awsS3SecretAccessKey = developmentConfig.awsS3.secretAccessKey;
    awsMediaVideoBucket = developmentConfig.awsS3.bucket.video;
    awsMediaVideoCloudFront = developmentConfig.awsS3.cloudFront.video;
    fileUploadFieldName = developmentConfig.fileFieldName;
    mainThreadMemoryPercent = developmentConfig.mainThreadMemoryPercent;
    maxWorkerThreadCount = developmentConfig.maxWorkerThreadCount;
    nanoId = customAlphabet(developmentConfig.nanoIdCharacters,
        developmentConfig.nanoIdLength);
}

// global Utils
global.ENVIRONMENT = environment;

global.mongoMainHost = mongoMainHost;
global.mongoMainDB = mongoMainDB;
global.mongoMainUser = mongoMainUser;
global.mongoMainPass = mongoMainPass;

global.awsS3AccessKey = awsS3AccessKey;
global.awsS3SecretAccessKey = awsS3SecretAccessKey;
global.cfVideoUrl = awsMediaVideoCloudFront;
global.awsVideoBucket = awsMediaVideoBucket;
global.fileUploadFieldName = fileUploadFieldName;

global.nanoId = nanoId;
global.mainThreadMemoryPercent = mainThreadMemoryPercent;
global.maxWorkerThreadCount = maxWorkerThreadCount;