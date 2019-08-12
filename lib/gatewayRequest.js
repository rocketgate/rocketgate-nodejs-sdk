var settings = require('../config/config').serviceSettings;

function GatewayRequest(options) {
    'use strict';

    // object used to make requests
    var request = {};

    // set version
    request.version = settings.VERSION_NUMBER;

    return request;
}

var exports = module.exports = GatewayRequest;
