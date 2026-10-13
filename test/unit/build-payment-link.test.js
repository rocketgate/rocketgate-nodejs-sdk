'use strict';

var assert = require('assert');
var createSDK = require('./helpers/sdk');
var fixtures = require('./helpers/fixtures');
var response = '<gatewayResponse><responseCode>0</responseCode><reasonCode>0</reasonCode>' +
    '<PAYMENT_LINK_URL>https://payments.example/pay/123</PAYMENT_LINK_URL></gatewayResponse>';

describe('Embedded fields payment links (unit)', function () {
    [
        'https://embedded.example/hostedpage/servlet/EmbeddedFieldsProxy?token=abc%2B123&invoice=xyz',
        'https://embedded.example/hostedpage/servlet/EmbeddedFieldsProxy;jsessionid=abc123.node1?submitToken=xyz',
        'https://embedded.example:8443/hostedpage/servlet/EmbeddedFieldsProxy?token=abc',
        'http://embedded.example/hostedpage/servlet/EmbeddedFieldsProxy?token=abc'
    ].forEach(function (token) {
        it('submits the embedded token through BuildPaymentLinkSubmit for ' + token, function () {
            var sdk = createSDK();
            var params = { transactionType: 'CC_PURCHASE', embeddedFieldsToken: token };
            sdk.reply(response);
            var result = fixtures.invoke(sdk, 'buildPaymentLink', params);
            var target = new URL(token.replace('EmbeddedFieldsProxy', 'BuildPaymentLinkSubmit'));
            assert.strictEqual(result.result, true);
            assert.strictEqual(result.response.PAYMENT_LINK_URL, 'https://payments.example/pay/123');
            assert.strictEqual(sdk.calls[0].uri, target.protocol + '//' + target.hostname + ':' +
                (target.port || (target.protocol === 'http:' ? '80' : '443')) + target.pathname + target.search);
            assert.strictEqual(result.request.embeddedFieldsToken, token);
            assert.strictEqual(result.request.gatewayURL, token.replace('EmbeddedFieldsProxy', 'BuildPaymentLinkSubmit'));
            assert.deepStrictEqual(params, { transactionType: 'CC_PURCHASE', embeddedFieldsToken: token });
            assert.deepStrictEqual(sdk.dnsCalls, []);
        });
    });

    it('gives the token precedence over gatewayURL as in PHP while honoring gatewayServer', function () {
        var sdk = createSDK();
        sdk.reply(response);
        fixtures.invoke(sdk, 'buildPaymentLink', {
            embeddedFieldsToken: 'https://embedded.example:8443/hostedpage/servlet/EmbeddedFieldsProxy?token=abc',
            gatewayURL: 'https://ignored.example/old', gatewayServer: 'override.example'
        });
        assert.strictEqual(sdk.calls[0].uri,
            'https://override.example:8443/hostedpage/servlet/BuildPaymentLinkSubmit?token=abc');
    });

    it('rejects an invalid embedded token URL before sending', function () {
        var sdk = createSDK();
        var result = fixtures.invoke(sdk, 'buildPaymentLink', { embeddedFieldsToken: 'invalid token' });
        assert.strictEqual(result.result, false);
        assert.strictEqual(result.response.responseCode, '4');
        assert.strictEqual(result.response.reasonCode, '401');
        assert.strictEqual(sdk.calls.length, 0);
    });
});
