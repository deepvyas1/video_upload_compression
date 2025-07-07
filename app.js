"use strict";

const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const cors = require("cors");
const helmet = require("helmet");
const workerpool = require("workerpool");
const app = (module.exports = express());

const mongoose = require("mongoose");

// Setting global variables, Please don't move this. Please add dependency after this line
require("./config/globalConstant");

const configDB = require("./config/db");

// Here, we are initialising the workerpool ( Singleton )
const videoCompressThreadScriptPath = path.resolve(`${__dirname}/server/customThreads/scripts/workerPoolVideoCompressScript.js`);
const videoCompressionWorkerPool = workerpool.pool(videoCompressThreadScriptPath, {
    minWorkers: 1,
    maxWorkers: parseInt(maxWorkerThreadCount)
});
console.log("Info ::: Video and image  worker pool initiated: min: ", videoCompressionWorkerPool.minWorkers, "max: ", videoCompressionWorkerPool.maxWorkers);
global.videoCompressionWorkerPool = videoCompressionWorkerPool;
console.log("Info ::: Video and image  worker pool creation stats: ", videoCompressionWorkerPool.stats()); // For testing

// configuration ===============================================================
mongoose.Promise = global.Promise;

// let options = {useNewUrlParser: true, useFindAndModify: false};
const options = {
};
mongoose.mainConnection = mongoose.createConnection(configDB.mongoMainUrl, options);

//------------------------------------------- MAIN DB CONNECTION EVENTS-----------------------------------------------//
// When successfully connected
mongoose.mainConnection.on("connected", async function () {
    console.log("Connected to main MongoDB ");
    mongoose.set("debug", true);
});

// If the connection throws an error
mongoose.mainConnection.on("error", function (err) {
    console.error("Mongoose main connection error: " + JSON.stringify(err));
});

// When the connection is disconnected
mongoose.mainConnection.on("disconnected", function () {
    console.log("Mongoose main connection disconnected");
});

//--------------------------------------PROCESS EVENTS CONNECTION CLOSURES--------------------------------------------//
// If the Node process ends using SIGINT, close both the Mongoose connection
process.on("SIGINT", async function () {
    mongoose.mainConnection.close(function () {
        console.log("Mongoose main connection disconnected through app termination");
        process.exit(0);
    });
});

// If the Node process exits using exit, close both the Mongoose connection
process.on("exit", async function () {
    mongoose.mainConnection.close(function () {
        console.log("Mongoose main connection disconnected through app termination");
        process.exit(0);
    });
});

app.use(bodyParser.json({limit: "300MB"}));
app.use(bodyParser.urlencoded({limit: "300MB", extended: true}));
app.use(cookieParser());
// app.use(expressValidator());

// Compress all routes and the response.
app.use(compression());

// Helmet helps you secure your Express apps by setting various HTTP headers
app.use(helmet());

//global.redisClient = redisClient;
global.applicationRootPath = path.resolve(__dirname);

let corsOptions;

if (ENVIRONMENT === "production") {
    corsOptions = {
        origin: "*",
        credentials: true,
        preflightContinue: false,
        optionsSuccessStatus: 204
    };
} else {
    corsOptions = {
        origin: ["https://fiddle.jshell.net"],
        credentials: true,
        preflightContinue: false,
        optionsSuccessStatus: 204
    };
}

app.use(cors(corsOptions));
app.options(/(.*)/, cors(corsOptions));

require("./routes")(app);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    let err = new Error("Not Found");
    err.status = 404;
    next(err);
});

// error handlers
// development error handler will print stacktrace
if (app.get("env") === "development") {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.json({
            message: err.message,
            error: err,
        });
    });
}

// production error handler no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    next(err);
});
