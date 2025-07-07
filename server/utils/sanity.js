'use strict';

const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

module.exports = {

    // checks if an object is of type User
    isValidUser: (userObj) => {
        return !(!userObj || !userObj.userId || !userObj.userName || !ObjectId.isValid(userObj.userId));
    },

    // checks if the given string is a valid mongoose object id
    isValidId: (id) => {
        return !(!id || !mongoose.isValidObjectId(id));
    },

    // This is to check whether the provided array is a valid array.
    isValidArray: (inputArray) => {
        return !(!inputArray || !Array.isArray(inputArray) || inputArray.length === 0)
    },

    // This is the function to check whether the object has at-least one key.
    isObjectValid: function (object) {
        return !(!object || !(typeof object === "object") || !Object.keys(object).length > 0);
    },

    // This is the function to verify if a string is a valid non-empty string.
    isValidNonEmptyString: function (string) {
        return typeof string === "string" && /\S+/.test(string);
    },

    // This is the function to verify whether a number is a non-zero valid positive number.
    isValidNonzeroPositiveNum: function (num) {
        return num && typeof num === "number" && num > 0;
    },
};
