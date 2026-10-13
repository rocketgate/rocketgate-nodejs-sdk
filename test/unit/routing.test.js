'use strict';

var assert = require('assert');
var createSDK = require('./helpers/sdk');
var fixtures = require('./helpers/fixtures');
var servlet = '/gateway/servlet/ServiceDispatcherAccess';

describe('Environment and endpoint routing (unit)', function () {
    it('uses production DNS and HTTPS by default', function () {
        var sdk = createSDK();
        sdk.reply(fixtures.success);
        fixtures.invoke(sdk, 'performCardScrub', {});
        assert.deepStrictEqual(sdk.dnsCalls, ['gateway.rocketgate.com']);
        assert.strictEqual(sdk.calls[0].uri, 'https://gateway-16.rocketgate.com:443' + servlet);
        assert.strictEqual(sdk.calls[0].timeout, 90000);
    });

    it('uses the development endpoint without live DNS when testMode is true', function () {
        var sdk = createSDK();
        sdk.reply(fixtures.success);
        fixtures.invoke(sdk, 'performCardScrub', { testMode: true });
        assert.deepStrictEqual(sdk.dnsCalls, []);
        assert.strictEqual(sdk.calls[0].uri, 'https://dev-gateway.rocketgate.com:443' + servlet);
    });

    it('starts each harness with fresh service state', function () {
        var development = createSDK();
        development.reply(fixtures.success);
        fixtures.invoke(development, 'performCardScrub', { testMode: true });
        var production = createSDK();
        production.reply(fixtures.success);
        fixtures.invoke(production, 'performCardScrub', { testMode: false });
        assert.strictEqual(production.calls[0].uri, 'https://gateway-16.rocketgate.com:443' + servlet);
    });

    it('maps the second production address to the matching hostname', function () {
        var sdk = createSDK({ records: ['72.32.126.131'] });
        sdk.reply(fixtures.success);
        fixtures.invoke(sdk, 'performCardScrub', {});
        assert.strictEqual(sdk.calls[0].uri, 'https://gateway-17.rocketgate.com:443' + servlet);
    });

    [
        { dnsError: new Error('synthetic DNS failure') },
        { records: [] },
        { records: ['192.0.2.1'] }
    ].forEach(function (options, index) {
        it('falls back to configured hosts for unusable DNS result ' + (index + 1), function () {
            var sdk = createSDK(options);
            sdk.reply(fixtures.success);
            fixtures.invoke(sdk, 'performCardScrub', {});
            assert.strictEqual(sdk.calls[0].uri, 'https://gateway-16.rocketgate.com:443' + servlet);
        });
    });

    it('honors explicit server, protocol, port, path, and timeout request fields', function () {
        var sdk = createSDK();
        sdk.reply(fixtures.success);
        fixtures.invoke(sdk, 'performCardScrub', {
            gatewayServer: 'custom.example', gatewayProtocol: 'https', portNo: '8443',
            gatewayServlet: 'custom/dispatcher', gatewayConnectTimeout: 8, gatewayReadTimeout: 4
        });
        assert.deepStrictEqual(sdk.dnsCalls, []);
        assert.strictEqual(sdk.calls[0].uri, 'https://custom.example:8443/custom/dispatcher');
        assert.strictEqual(sdk.calls[0].timeout, 8000);
    });

    it('applies service settings and uses the larger timeout in milliseconds', function () {
        var sdk = createSDK();
        var callback = function (error, result) { assert.strictEqual(error, null); assert.strictEqual(result, true); };
        sdk.service.setProtocol('http', callback);
        sdk.service.setPortNo('8080', callback);
        sdk.service.setServlet('alternate', callback);
        sdk.service.setConnectTimeout(5, callback);
        sdk.service.setReadTimeout(12, callback);
        sdk.reply(fixtures.success);
        fixtures.invoke(sdk, 'performCardScrub', { gatewayServer: 'custom.example' });
        assert.strictEqual(sdk.calls[0].uri, 'http://custom.example:8080/alternate');
        assert.strictEqual(sdk.calls[0].timeout, 12000);
    });

    ['performAuthOnly', 'performPurchase', 'performCredit', 'performTicket', 'performVoid'].forEach(function (method) {
        it(method + ' routes a referenced transaction by the hexadecimal GUID site prefix', function () {
            var sdk = createSDK();
            sdk.reply(fixtures.success);
            if (method === 'performAuthOnly' || method === 'performPurchase') sdk.reply(fixtures.confirmed);
            var result = fixtures.invoke(sdk, method, { referenceGUID: '1100000000000001' });
            assert.strictEqual(result.result, true);
            assert.deepStrictEqual(sdk.dnsCalls, []);
            assert.strictEqual(sdk.calls[0].uri, 'https://gateway-17.rocketgate.com:443' + servlet);
        });
    });

    it('routes a 15-character GUID using its single hexadecimal site digit', function () {
        var sdk = createSDK();
        sdk.reply(fixtures.success);
        fixtures.invoke(sdk, 'performVoid', { referenceGUID: 'a00000000000001' });
        assert.strictEqual(sdk.calls[0].uri, 'https://gateway-10.rocketgate.com:443' + servlet);
    });

    it('preserves an explicit server override for a targeted transaction', function () {
        var sdk = createSDK();
        sdk.reply(fixtures.success);
        fixtures.invoke(sdk, 'performVoid', { referenceGUID: '1100000000000001', gatewayServer: 'custom.example' });
        assert.strictEqual(sdk.calls[0].uri, 'https://custom.example:443' + servlet);
    });
});
