'use strict';

var crypto = require('crypto'),
    urlencode = require('urlencode');

function computeHash(params, url) {
    // start with id
    var urlArgs = urlencode('id') + '=' + urlencode(params.id),
        hashArgs = 'id=' + params.id;

    // remove id property to avoid duplication
    delete params.id;

    // add params to url
    for (var param in params) {
        if (param !== 'secret') {
            urlArgs += '&' + urlencode(param) + '=' + urlencode(params[param]);
            hashArgs += '&' + param + '=' + params[param];
        }
    }

    // add secret value to hash arguments
    hashArgs += '&secret=' + params.secret;

    var computedHash = urlencode(crypto.createHash('sha1').update(hashArgs).digest('base64'));
    return url + urlArgs + '&hash=' + computedHash;
}

/**
 * Create a hosted page URL
 *
 * @param {Object}      params
 * @param {Function}    callback
 */
function createHostedPageUrl(params, callback) {
    var url = 'https://secure.rocketgate.com/hostedpage/servlet/HostedPagePurchase?';

    if (params.dev) {
        url = 'https://dev-secure.rocketgate.com/hostedpage/servlet/HostedPagePurchase?';
        delete params.dev;
    }
    var fullUrlWithHash = computeHash(params, url);
    return callback(null, fullUrlWithHash);
}

/**
 * Create a embedded fields form script url
 *
 * @param {Object}      params
 * @param {Function}    callback
 */
function createEmbeddedFieldsScript(params, callback) {
    var url = 'https://secure.rocketgate.com/hostedpage/EmbeddedFields.jsp?';

    if (params.dev) {
        url = 'https://dev-secure.rocketgate.com/hostedpage/EmbeddedFields.jsp?';
        delete params.dev;
    }
    var fullUrlWithHash = computeHash(params, url);
    return callback(null, fullUrlWithHash);
}

module.exports = {
    createHostedPageUrl: createHostedPageUrl,
    createEmbeddedFieldsScript: createEmbeddedFieldsScript
};
