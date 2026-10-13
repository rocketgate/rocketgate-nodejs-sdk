'use strict';

var assert = require('assert');
var createSDK = require('./helpers/sdk');
var fixtures = require('./helpers/fixtures');
var servlet = '/gateway/servlet/ServiceDispatcherAccess';

describe('Environment and routing regressions (unit)', function () {
    [{ testMode: false }, {}].forEach(function (params) {
        it('preserves the service test mode after a public call with parameters ' + JSON.stringify(params), function () {
            var sdk = createSDK();
            sdk.reply(fixtures.success);
            fixtures.invoke(sdk, 'performCardScrub', { testMode: true });
            sdk.reply(fixtures.success);
            fixtures.invoke(sdk, 'performCardScrub', params);
            assert.strictEqual(sdk.calls[1].uri, 'https://dev-gateway.rocketgate.com:443' + servlet);
        });
    });

    it('allows setTestMode(false) to restore production routing', function () {
        var sdk = createSDK();
        sdk.service.setTestMode(true, function () {});
        var development = fixtures.capture();
        sdk.reply(fixtures.success);
        sdk.service.performCardScrub({}, {}, development);
        sdk.flush();
        assert.strictEqual(development.calls.length, 1);
        assert.strictEqual(sdk.calls[0].uri, 'https://dev-gateway.rocketgate.com:443' + servlet);
        var error;
        sdk.service.setTestMode(false, function (err) { error = err; });
        assert.strictEqual(error, null);
        sdk.reply(fixtures.success);
        var production = fixtures.capture();
        sdk.service.performCardScrub({}, {}, production);
        sdk.flush();
        sdk.assertIdle();
        assert.strictEqual(production.calls.length, 1);
        assert.strictEqual(sdk.calls[1].uri, 'https://gateway-16.rocketgate.com:443' + servlet);
    });

    it('uses the whole hostname supplied to setHost', function () {
        var sdk = createSDK();
        sdk.service.setHost('custom.example', function () {});
        sdk.reply(fixtures.success);
        fixtures.invoke(sdk, 'performCardScrub', {});
        assert.strictEqual(sdk.calls[0].uri, 'https://custom.example:443' + servlet);
    });

    ['1100000000000001', 1100000000000001].forEach(function (guid) {
        it('copies a ' + typeof guid + ' xsellReferenceXact into referenceGUID for targeted routing', function () {
            var sdk = createSDK();
            var params = { xsellReferenceXact: guid };
            sdk.reply(fixtures.success);
            var result = fixtures.invoke(sdk, 'generateXsell', params);
            assert.strictEqual(result.result, true);
            assert.strictEqual(result.request.referenceGUID, guid);
            assert.deepStrictEqual(params, { xsellReferenceXact: guid });
            assert.strictEqual(sdk.calls[0].uri, 'https://gateway-17.rocketgate.com:443' + servlet);
            assert.ok(sdk.calls[0].body.indexOf('<xsellReferenceXact>' + guid + '</xsellReferenceXact>') !== -1);
            assert.ok(sdk.calls[0].body.indexOf('<referenceGUID>' + guid + '</referenceGUID>') !== -1);
        });
    });

    [undefined, null, 'not-a-guid'].forEach(function (guid) {
        it('rejects referenceGUID ' + String(guid) + ' before sending a void', function () {
            var sdk = createSDK();
            var callback = fixtures.capture();
            sdk.api.performVoid({ referenceGUID: guid }, callback);
            assert.strictEqual(sdk.calls.length, 0, 'Invalid GUID must not reach HTTP transport');
            sdk.flush();
            sdk.assertIdle();
            assert.strictEqual(callback.calls.length, 1);
            assert.strictEqual(callback.calls[0].result, false);
            assert.strictEqual(callback.calls[0].response.reasonCode, '410');
        });
    });

    ['gatewayURL', 'embeddedFieldsToken'].forEach(function (field) {
        ['performCardScrub', 'performVoid'].forEach(function (method) {
            it(method + ' preserves the hostname, port, and path from ' + field, function () {
                var sdk = createSDK();
                var params = { referenceGUID: '1000000000000001' };
                params[field] = 'https://custom.example:8443/api?token=synthetic';
                sdk.reply(fixtures.success);
                fixtures.invoke(sdk, method, params);
                assert.strictEqual(sdk.calls[0].uri, 'https://custom.example:8443/api?token=synthetic');
            });
        });
    });

    it('uses the HTTP default port when a gateway URL has no explicit port', function () {
        var sdk = createSDK();
        sdk.reply(fixtures.success);
        fixtures.invoke(sdk, 'performCardScrub', { gatewayURL: 'http://custom.example/api' });
        var parsed = require('url').parse(sdk.calls[0].uri);
        assert.strictEqual(parsed.hostname, 'custom.example');
        assert.ok(parsed.port === null || parsed.port === '80');
        assert.strictEqual(parsed.path, '/api');
    });

    it('builds the payment-link endpoint with one leading slash', function () {
        var sdk = createSDK();
        sdk.reply(fixtures.success);
        fixtures.invoke(sdk, 'buildPaymentLink', { transactionType: 'CC_PURCHASE' });
        assert.strictEqual(sdk.calls[0].uri,
            'https://gateway-16.rocketgate.com:443/hostedpage/servlet/BuildPaymentLinkSubmit');
    });
});

describe('Routing validation and endpoint precedence (unit)', function () {
    [true, {}, [], '', '1', '123', '10000000000000', '0x1000000000000001',
        '10000000000000001', '100000000000000Z', 123, 10000000000000,
        9007199254740992, 1.5, -1].forEach(function (guid) {
        it('rejects malformed or imprecise GUID ' + JSON.stringify(guid), function () {
            var sdk = createSDK();
            var result = fixtures.invoke(sdk, 'performTicket', { referenceGUID: guid });
            assert.strictEqual(result.result, false);
            assert.strictEqual(result.response.responseCode, '4');
            assert.strictEqual(result.response.reasonCode, '410');
            assert.strictEqual(sdk.calls.length, 0);
            assert.strictEqual(sdk.dnsCalls.length, 0);
        });
    });

    [
        ['performAuthOnly', 'CC_AUTH', 'referenceGUID', true],
        ['performPurchase', 'CC_PURCHASE', 'referenceGUID', true],
        ['performCredit', 'CC_CREDIT', 'referenceGUID', false],
        ['generateXsell', 'GENERATEXSELL', 'xsellReferenceXact', false]
    ].forEach(function (operation) {
        var method = operation[0];
        var field = operation[2];
        [undefined, null, '', false, 0, NaN].forEach(function (guid) {
            it(method + ' uses normal routing for ' + field + ' ' + String(guid), function () {
                var sdk = createSDK();
                var params = {};
                if (method === 'generateXsell') params.referenceGUID = '1100000000000001';
                params[field] = guid;
                sdk.reply(fixtures.success);
                if (operation[3]) sdk.reply(fixtures.confirmed);
                var result = fixtures.invoke(sdk, method, params);
                assert.strictEqual(result.result, true);
                assert.strictEqual(sdk.calls.length, operation[3] ? 2 : 1);
                assert.strictEqual(sdk.dnsCalls.length, 1);
                assert.strictEqual(sdk.calls[0].uri, 'https://gateway-16.rocketgate.com:443' + servlet);
                assert.ok(sdk.calls[0].body.indexOf('<transactionType>' + operation[1] + '</transactionType>') !== -1);
                if (operation[3]) {
                    assert.strictEqual(sdk.calls[1].uri, 'https://gateway-16.rocketgate.com:443' + servlet);
                    assert.ok(sdk.calls[1].body.indexOf('<transactionType>CC_CONFIRM</transactionType>') !== -1);
                    assert.ok(sdk.calls[1].body.indexOf('<referenceGUID>1000000000000001</referenceGUID>') !== -1);
                }
                if (method === 'generateXsell') {
                    assert.strictEqual(sdk.calls[0].body.indexOf('1100000000000001'), -1);
                    assert.strictEqual(params.referenceGUID, '1100000000000001');
                }
            });
        });

        it(method + ' still rejects a truthy malformed reference before sending', function () {
            var sdk = createSDK();
            var params = {};
            params[field] = 'not-a-guid';
            var result = fixtures.invoke(sdk, method, params);
            assert.strictEqual(result.result, false);
            assert.strictEqual(result.response.responseCode, '4');
            assert.strictEqual(result.response.reasonCode, '410');
            assert.strictEqual(sdk.calls.length, 0);
            assert.strictEqual(sdk.dnsCalls.length, 0);
        });
    });

    it('routes an uppercase 64-bit GUID without losing precision', function () {
        var sdk = createSDK();
        sdk.reply(fixtures.success);
        fixtures.invoke(sdk, 'performVoid', { referenceGUID: 'AFFFFFFFFFFFFFFF' });
        assert.strictEqual(sdk.calls[0].uri, 'https://gateway-175.rocketgate.com:443' + servlet);
        assert.ok(sdk.calls[0].body.indexOf('<referenceGUID>AFFFFFFFFFFFFFFF</referenceGUID>') !== -1);
    });

    [[100000000000001, 1], [1100000000000001, 17]].forEach(function (reference) {
        it('retains safe legacy numeric GUID input with ' + String(reference[0]).length + ' digits', function () {
            var sdk = createSDK();
            sdk.reply(fixtures.success);
            var result = fixtures.invoke(sdk, 'performVoid', { referenceGUID: reference[0] });
            assert.strictEqual(result.result, true);
            assert.strictEqual(sdk.calls[0].uri, 'https://gateway-' + reference[1] + '.rocketgate.com:443' + servlet);
        });
    });

    it('overwrites a different referenceGUID with the cross-sell GUID for routing and serialization', function () {
        var sdk = createSDK();
        var params = { xsellReferenceXact: '1100000000000001', referenceGUID: '1000000000000001' };
        sdk.reply(fixtures.success);
        var result = fixtures.invoke(sdk, 'generateXsell', params);
        assert.strictEqual(result.request.referenceGUID, params.xsellReferenceXact);
        assert.strictEqual(params.referenceGUID, '1000000000000001');
        assert.strictEqual(sdk.calls[0].uri, 'https://gateway-17.rocketgate.com:443' + servlet);
        assert.ok(sdk.calls[0].body.indexOf('<xsellReferenceXact>1100000000000001</xsellReferenceXact>') !== -1);
        assert.ok(sdk.calls[0].body.indexOf('<referenceGUID>1100000000000001</referenceGUID>') !== -1);
        assert.strictEqual(sdk.calls[0].body.indexOf('1000000000000001'), -1);
    });

    it('clears an unrelated referenceGUID when no cross-sell reference is supplied', function () {
        var sdk = createSDK();
        var params = { referenceGUID: '1100000000000001' };
        sdk.reply(fixtures.success);
        var result = fixtures.invoke(sdk, 'generateXsell', params);
        assert.strictEqual(result.result, true);
        assert.strictEqual(result.request.referenceGUID, undefined);
        assert.strictEqual(params.referenceGUID, '1100000000000001');
        assert.strictEqual(sdk.calls[0].uri, 'https://gateway-16.rocketgate.com:443' + servlet);
        assert.strictEqual(sdk.calls[0].body.indexOf('referenceGUID'), -1);
    });

    ['not-a-guid', 9007199254740992].forEach(function (guid) {
        it('rejects invalid cross-sell reference ' + String(guid) + ' despite a valid referenceGUID', function () {
            var sdk = createSDK();
            var result = fixtures.invoke(sdk, 'generateXsell', {
                xsellReferenceXact: guid, referenceGUID: '1000000000000001'
            });
            assert.strictEqual(result.result, false);
            assert.strictEqual(result.response.responseCode, '4');
            assert.strictEqual(result.response.reasonCode, '410');
            assert.strictEqual(sdk.calls.length, 0);
            assert.strictEqual(sdk.dnsCalls.length, 0);
        });
    });

    ['not a URL', 'https://custom.example:invalid/api', 'ftp://custom.example/api', 'https://'].forEach(function (url) {
        it('rejects invalid gateway URL ' + url + ' on both routing paths', function () {
            ['performCardScrub', 'performVoid'].forEach(function (method) {
                var sdk = createSDK();
                var result = fixtures.invoke(sdk, method, { gatewayURL: url, referenceGUID: '1000000000000001' });
                assert.strictEqual(result.result, false);
                assert.strictEqual(result.response.responseCode, '3');
                assert.strictEqual(result.response.reasonCode, '304');
                assert.strictEqual(result.response.exception, 'Invalid gateway URL');
                assert.strictEqual(sdk.calls.length, 0);
                assert.strictEqual(sdk.dnsCalls.length, 0);
            });
        });
    });

    it('honors the explicit server and full URL port, path, and encoded query', function () {
        var sdk = createSDK();
        sdk.reply(fixtures.success);
        fixtures.invoke(sdk, 'performCardScrub', {
            gatewayURL: 'https://url.example/a%2Fb?token=x%2By+z#ignored',
            embeddedFieldsToken: 'http://other.example/ignored',
            gatewayServer: 'override.example', portNo: '9999'
        });
        assert.strictEqual(sdk.calls[0].uri, 'https://override.example:443/a%2Fb?token=x%2By+z');
        assert.strictEqual(sdk.dnsCalls.length, 0);
    });

    it('honors gatewayPortNo before the legacy portNo field', function () {
        var sdk = createSDK();
        sdk.reply(fixtures.success);
        fixtures.invoke(sdk, 'performCardScrub', {
            gatewayServer: 'custom.example', gatewayPortNo: '8443', portNo: '9999', gatewayServlet: '/api'
        });
        assert.strictEqual(sdk.calls[0].uri, 'https://custom.example:8443/api');
    });

    it('preserves the brackets around an IPv6 hostname from a full URL', function () {
        var sdk = createSDK();
        sdk.reply(fixtures.success);
        fixtures.invoke(sdk, 'performVoid', {
            referenceGUID: '1000000000000001', gatewayURL: 'https://[::1]:8443/api'
        });
        assert.strictEqual(sdk.calls[0].uri, 'https://[::1]:8443/api');
    });
});
