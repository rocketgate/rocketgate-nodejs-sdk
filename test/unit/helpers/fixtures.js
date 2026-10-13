'use strict';

var assert = require('assert');

exports.success = '<gatewayResponse><responseCode>0</responseCode><reasonCode>0</reasonCode>' +
    '<guidNo>1000000000000001</guidNo><authNo>001234</authNo></gatewayResponse>';
exports.confirmed = '<gatewayResponse><responseCode>0</responseCode><reasonCode>0</reasonCode></gatewayResponse>';
exports.decline = '<gatewayResponse><responseCode>1</responseCode><reasonCode>104</reasonCode></gatewayResponse>';
exports.systemError = '<gatewayResponse><responseCode>3</responseCode><reasonCode>311</reasonCode>' +
    '<guidNo>1000000000000002</guidNo></gatewayResponse>';

exports.capture = function () {
    var callback = function (result, request, response) {
        callback.calls.push({ result: result, request: request, response: response });
    };
    callback.calls = [];
    return callback;
};

exports.invoke = function (sdk, method, params) {
    var callback = exports.capture();
    sdk.api[method](params || {}, callback);
    sdk.flush();
    sdk.assertIdle();
    assert.strictEqual(callback.calls.length, 1, 'Public callback must run exactly once');
    return callback.calls[0];
};
