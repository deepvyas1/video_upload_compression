'use strict';

function getMongoDatabaseUrls() {
    let mongoMainUrl;
    const mongoMainHosts = eval(mongoMainHost);

    if (ENVIRONMENT === 'production') {
        mongoMainUrl = `mongodb+srv://${mongoMainUser}:${mongoMainPass}@${mongoMainHosts.join()}/${mongoMainDB}?retryWrites=true&w=majority`;
    } else if (ENVIRONMENT === 'staging') {
        mongoMainUrl = `mongodb+srv://${mongoMainUser}:${mongoMainPass}@${mongoMainHosts.join()}/${mongoMainDB}?retryWrites=true&w=majority`;
    } else {
        mongoMainUrl = `mongodb://${mongoMainHosts.join()}/${mongoMainDB}`;
    }
    return {mongoMainUrl};
}

let {mongoMainUrl} = getMongoDatabaseUrls();

module.exports = {
    mongoMainUrl: mongoMainUrl
};