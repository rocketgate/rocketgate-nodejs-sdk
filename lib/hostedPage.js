var crypto = require('crypto'),
    urlencode = require('urlencode');

function HostedPage(options) {
    'use strict';

    var publicAPI,
        url = 'https://secure.rocketgate.com/hostedpage/servlet/HostedPagePurchase?';

    /**
    * Create a hosted page URL
    *
    * @param {Object}      params
    * @param {Function}    callback
    */
    function createHostedPageUrl(params, callback) {
        if (params.dev) {
            url = 'https://dev-secure.rocketgate.com/hostedpage/servlet/HostedPagePurchase?';
            delete params.dev;
        }

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

        var computedHash = urlencode(crypto.createHash('sha1').update(hashArgs).digest('base64')),
            fullUrl = url + urlArgs + '&hash=' + computedHash;

        callback(null, fullUrl);
    }



    publicAPI = {
        createHostedPageUrl: createHostedPageUrl
    };

    return publicAPI;
}

var exports = module.exports = HostedPage();
