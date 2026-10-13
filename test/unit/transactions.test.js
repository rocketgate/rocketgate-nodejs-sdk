'use strict';

var assert = require('assert');
var createSDK = require('./helpers/sdk');
var fixtures = require('./helpers/fixtures');
var servlet = '/gateway/servlet/ServiceDispatcherAccess';

describe('Failures and failover (unit)', function () {
    it('returns a bank decline without retrying or confirming the purchase', function () {
        var sdk = createSDK();
        sdk.reply(fixtures.decline);
        var result = fixtures.invoke(sdk, 'performPurchase', {});
        assert.strictEqual(result.result, false);
        assert.strictEqual(result.response.responseCode, '1');
        assert.strictEqual(result.response.reasonCode, '104');
        assert.strictEqual(result.response.result, 'Declined');
        assert.strictEqual(sdk.calls.length, 1);
    });

    it('retries a system error on the other host with failure metadata', function () {
        var sdk = createSDK({ records: ['69.20.127.91', '72.32.126.131'] });
        sdk.reply(fixtures.systemError);
        sdk.reply(fixtures.success);
        var result = fixtures.invoke(sdk, 'performCardScrub', {
            failedServer: 'stale.example', failedResponseCode: '9', failedReasonCode: '999', failedGUID: 'stale'
        });
        assert.strictEqual(result.result, true);
        assert.strictEqual(sdk.calls.length, 2);
        var hosts = sdk.calls.map(function (call) { return require('url').parse(call.uri).hostname; });
        assert.deepStrictEqual(hosts.slice().sort(), ['gateway-16.rocketgate.com', 'gateway-17.rocketgate.com']);
        assert.strictEqual(sdk.calls[0].body.indexOf('<failedServer>'), -1);
        assert.strictEqual(sdk.calls[0].body.indexOf('<failedResponseCode>'), -1);
        assert.strictEqual(sdk.calls[0].body.indexOf('<failedReasonCode>'), -1);
        assert.strictEqual(sdk.calls[0].body.indexOf('<failedGUID>'), -1);
        assert.ok(sdk.calls[1].body.indexOf('<failedServer>' + hosts[0] + '</failedServer>') !== -1);
        assert.ok(sdk.calls[1].body.indexOf('<failedResponseCode>3</failedResponseCode>') !== -1);
        assert.ok(sdk.calls[1].body.indexOf('<failedReasonCode>311</failedReasonCode>') !== -1);
        assert.ok(sdk.calls[1].body.indexOf('<failedGUID>1000000000000002</failedGUID>') !== -1);
    });

    it('stops after both fallback hosts return system errors', function () {
        var sdk = createSDK({ dnsError: new Error('synthetic DNS failure') });
        sdk.reply(fixtures.systemError);
        sdk.reply(fixtures.systemError);
        var result = fixtures.invoke(sdk, 'performPurchase', {});
        assert.strictEqual(result.result, false);
        assert.strictEqual(result.response.reasonCode, '311');
        assert.strictEqual(sdk.calls.length, 2);
        assert.deepStrictEqual(sdk.delays, []);
    });

    it('does not fail over an explicit endpoint', function () {
        var sdk = createSDK();
        sdk.reply(fixtures.systemError);
        var result = fixtures.invoke(sdk, 'performPurchase', { gatewayServer: 'custom.example' });
        assert.strictEqual(result.result, false);
        assert.strictEqual(sdk.calls.length, 1);
    });

    [
        ['network failure', function (sdk) { sdk.fail(new Error('synthetic timeout')); }, 'synthetic timeout'],
        ['HTTP error', function (sdk) { sdk.reply('unavailable', 503, 'Service Unavailable'); }, '503 Service Unavailable'],
        ['non-XML response', function (sdk) { sdk.reply('not a gateway response'); }, "Can't parse response body as XML"]
    ].forEach(function (scenario) {
        it('returns a structured failure for a ' + scenario[0], function () {
            var sdk = createSDK();
            scenario[1](sdk);
            var result = fixtures.invoke(sdk, 'performCardScrub', { gatewayServer: 'custom.example' });
            assert.strictEqual(result.result, false);
            assert.strictEqual(result.response.responseCode, '3');
            assert.strictEqual(result.response.reasonCode, '304');
            var error = result.response.exception;
            assert.strictEqual(error.message || error, scenario[2]);
            assert.strictEqual(sdk.calls.length, 1);
        });
    });

    it('rejects an empty reference GUID without sending a void', function () {
        var sdk = createSDK();
        var result = fixtures.invoke(sdk, 'performVoid', { referenceGUID: '' });
        assert.strictEqual(result.result, false);
        assert.strictEqual(result.response.responseCode, '4');
        assert.strictEqual(result.response.reasonCode, '410');
        assert.strictEqual(sdk.calls.length, 0);
    });
});

describe('Transaction confirmation (unit)', function () {
    it('confirms on the returned GUID site and retains the original approval details', function () {
        var sdk = createSDK();
        sdk.reply(fixtures.success.replace('1000000000000001', '1100000000000001'));
        sdk.reply(fixtures.confirmed);
        var result = fixtures.invoke(sdk, 'performPurchase', {});
        assert.strictEqual(sdk.calls[0].uri, 'https://gateway-16.rocketgate.com:443' + servlet);
        assert.strictEqual(sdk.calls[1].uri, 'https://gateway-17.rocketgate.com:443' + servlet);
        assert.ok(sdk.calls[1].body.indexOf('<transactionType>CC_CONFIRM</transactionType>') !== -1);
        assert.ok(sdk.calls[1].body.indexOf('<referenceGUID>1100000000000001</referenceGUID>') !== -1);
        assert.strictEqual(result.result, true);
        assert.strictEqual(result.response.guidNo, '1100000000000001');
        assert.strictEqual(result.response.authNo, '001234');
    });

    it('waits 2000 milliseconds before retrying confirmation, without resending the purchase', function () {
        var sdk = createSDK();
        var callback = fixtures.capture();
        sdk.reply(fixtures.success);
        sdk.reply(fixtures.systemError);
        sdk.reply(fixtures.confirmed);
        sdk.api.performPurchase({}, callback);
        sdk.flush();
        assert.strictEqual(callback.calls.length, 0);
        assert.strictEqual(sdk.calls.length, 2);
        assert.deepStrictEqual(sdk.delays, [2000]);
        sdk.advance(1999);
        assert.strictEqual(sdk.calls.length, 2);
        assert.strictEqual(callback.calls.length, 0);
        sdk.advance(1);
        sdk.assertIdle();
        assert.strictEqual(callback.calls.length, 1);
        assert.strictEqual(callback.calls[0].result, true);
        assert.strictEqual(callback.calls[0].response.authNo, '001234');
        assert.strictEqual(sdk.calls.length, 3);
        sdk.calls.slice(1).forEach(function (call) {
            assert.ok(call.body.indexOf('<transactionType>CC_CONFIRM</transactionType>') !== -1);
        });
    });

    it('returns the final confirmation failure and stops after one confirmation retry', function () {
        var sdk = createSDK();
        var callback = fixtures.capture();
        sdk.reply(fixtures.success);
        sdk.reply(fixtures.systemError);
        sdk.reply(fixtures.decline);
        sdk.api.performAuthOnly({}, callback);
        sdk.flush();
        sdk.advance(2000);
        sdk.assertIdle();
        assert.strictEqual(callback.calls.length, 1);
        assert.strictEqual(callback.calls[0].result, false);
        assert.strictEqual(callback.calls[0].response.responseCode, '1');
        assert.strictEqual(callback.calls[0].response.reasonCode, '104');
        assert.strictEqual(callback.calls[0].response.guidNo, '1000000000000001');
        assert.strictEqual(sdk.calls.length, 3);
    });

    it('reports a missing confirmation GUID without another HTTP request', function () {
        var sdk = createSDK();
        sdk.reply(fixtures.confirmed);
        var result = fixtures.invoke(sdk, 'performPurchase', {});
        assert.strictEqual(result.result, false);
        assert.strictEqual(result.response.responseCode, '3');
        assert.strictEqual(result.response.reasonCode, '307');
        assert.strictEqual(result.response.exception, 'BUG-CHECK - Missing confirmation GUID');
        assert.strictEqual(sdk.calls.length, 1);
    });
});
