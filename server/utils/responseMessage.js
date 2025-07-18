"use strict";

function GenericSuccessMessage() {
    this.code = 200;
    this.status = "success";
}

function GenericFailureMessage() {
    this.code = 400;
    this.status = "failure";
}

function ErrorInQueryingDB() {
    this.code = 500;
    this.status = "failure";
    this.message = "Please try again after some time";
}

function ObjectDoesNotExistInDB() {
    this.code = 200;
    this.status = "not_found";
    this.message = "The queried object does not exist";
}

module.exports = {
    // These are prototypes
    GenericSuccessMessage: GenericSuccessMessage,

    GenericFailureMessage: GenericFailureMessage,

    ErrorInQueryingDB: ErrorInQueryingDB,

    ObjectDoesNotExistInDB: ObjectDoesNotExistInDB,

    incorrectPayload: {
        code: 400,
        status: "failure",
        message: "Payload is not correct. It's missing one or more of the required information."
    },
    fileTypeNotAllowed: {
        code: 400,
        status: "failure",
        message: "This filetype is not allowed"
    },
    invalidMimeType: {
        code: 400,
        status: "failure",
        message: "Invalid Mimetype"
    },
    fileUploadFailed: {
        code: 500,
        status: "failure",
        message: "something went wrong. We are investigating"
    }
};
