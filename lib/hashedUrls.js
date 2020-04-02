'use strict';

var crypto = require('crypto'),
    urlencode = require('urlencode');

function computeHash(urlArgs, hashArgs, params, url) {
    // add params to url
    Object.keys(params).forEach(key => {
        const value = params[key];
        if (key !== 'secret') {
            urlArgs += `&${urlencode(key)}=${urlencode(value)}`;
            hashArgs += `&${key}=${value}`;
        }
    });

    // add secret value to hash arguments
    hashArgs += `&secret=${params.secret}`;

    const hashedArgs = urlencode(
        crypto
            .createHash('sha1')
            .update(hashArgs)
            .digest('base64')
    );
    return `${url + urlArgs}&hash=${hashedArgs}`;
}

/**
 * Create a hosted page URL
 *
 * @param {Object}      params
 * @param {Function}    callback
 */
function createHostedPageUrl(params, callback) {
    let url = 'https://secure.rocketgate.com/hostedpage/servlet/HostedPagePurchase?';

    if (params.dev) {
        url = 'https://dev-secure.rocketgate.com/hostedpage/servlet/HostedPagePurchase?';
        delete params.dev;
    }
    // start with id
    const urlArgs = `${urlencode('id')}=${urlencode(params.id)}`;
    const hashArgs = `id=${params.id}`;

    // remove id property to avoid duplication
    delete params.id;

    const fullUrlWithHash = computeHash(urlArgs, hashArgs, params, url);

    return callback(null, fullUrlWithHash);
}

/**
 * Create an embedded fields form script url with hash
 *
 * @param {Object}      params
 * @param {Function}    callback
 */
function createEmbeddedFieldsScript(params, callback) {
    let url = 'https://secure.rocketgate.com/hostedpage/EmbeddedFields.jsp?';

    if (params.dev) {
        url = 'https://dev-secure.rocketgate.com/hostedpage/EmbeddedFields.jsp?';
        delete params.dev;
    }
    const urlArgs = `${urlencode('merch')}=${urlencode(params.merch)}`;
    const hashArgs = `merch=${params.merch}`;

    delete params.merch;

    const fullUrlWithHash = computeHash(urlArgs, hashArgs, params, url);

    return callback(null, fullUrlWithHash);
}

module.exports = {
    createHostedPageUrl,
    createEmbeddedFieldsScript
};
