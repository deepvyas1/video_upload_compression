"use strict";

const express = require("express");
const sseRouter = express.Router();
const sseController = require("./sseController");

sseRouter.get("/upload", (req, res) => {
    sseController.postMediaEvent(req, res);
});

module.exports = {
    sseRouter: sseRouter
}