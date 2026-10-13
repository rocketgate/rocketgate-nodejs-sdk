'use strict';

var assert = require('assert');
var createSDK = require('./helpers/sdk');
var fixtures = require('./helpers/fixtures');
var servlet = '/gateway/servlet/ServiceDispatcherAccess';

describe('Service environments and confirmations (unit)', function () {
    [true, false].forEach(function (mode) {
        it('uses service test mode ' + mode + ' for overlapping purchases and confirmations', function () {
            var sdk = createSDK();
            sdk.service.setTestMode(mode, function () {});
            var callbacks = ['first', 'second'].map(function (customer) {
                var callback = fixtures.capture();
                sdk.api.performPurchase({ merchantCustomerID: customer }, callback);
                return callback;
            });
            for (var i = 0; i < 4; i++) sdk.reply(fixtures.success);
            sdk.flush();
            sdk.assertIdle();
            callbacks.forEach(function (callback) {
                assert.strictEqual(callback.calls.length, 1);
                assert.strictEqual(callback.calls[0].result, true);
            });
            assert.strictEqual(sdk.calls.length, 4);
            sdk.calls.forEach(function (call) {
                var isConfirmation = call.body.indexOf('<transactionType>CC_CONFIRM</transactionType>') !== -1;
                var host = mode ? (isConfirmation ? 'dev-gateway-16' : 'dev-gateway') : 'gateway-16';
                assert.strictEqual(call.uri, 'https://' + host + '.rocketgate.com:443' + servlet);
            });
        });

        it('uses service test mode ' + mode + ' for public calls without adding a request testMode', function () {
            var sdk = createSDK();
            sdk.service.setTestMode(mode, function () {});
            sdk.reply(fixtures.success);
            var result = fixtures.invoke(sdk, 'performCardScrub', {});
            var host = mode ? 'dev-gateway' : 'gateway-16';
            assert.strictEqual(sdk.calls[0].uri, 'https://' + host + '.rocketgate.com:443' + servlet);
            assert.strictEqual(Object.prototype.hasOwnProperty.call(result.request, 'testMode'), false);
            assert.strictEqual(sdk.calls[0].body.indexOf('<testMode>'), -1);
        });

        ['performCardScrub', 'performVoid'].forEach(function (method) {
            it(method + ' ignores request testMode when the service is configured to ' + mode, function () {
                var sdk = createSDK();
                sdk.service.setTestMode(mode, function () {});
                sdk.reply(fixtures.success);
                var callback = fixtures.capture();
                sdk.service[method]({ testMode: !mode, referenceGUID: '1100000000000001' }, {}, callback);
                sdk.flush();
                sdk.assertIdle();
                assert.strictEqual(callback.calls.length, 1);
                assert.strictEqual(callback.calls[0].result, true);
                var host = mode ? 'dev-gateway' : 'gateway';
                if (method === 'performVoid') host += '-17';
                else if (!mode) host += '-16';
                assert.strictEqual(sdk.calls[0].uri, 'https://' + host + '.rocketgate.com:443' + servlet);
            });
        });
    });

    it('keeps purchases and confirmation retries in the configured development environment', function () {
        var sdk = createSDK();
        sdk.service.setTestMode(true, function () {});
        var test = fixtures.capture();
        sdk.reply(fixtures.success);
        sdk.reply(fixtures.systemError);
        sdk.api.performPurchase({}, test);
        sdk.flush();
        assert.strictEqual(test.calls.length, 0);

        sdk.reply(fixtures.success);
        sdk.reply(fixtures.confirmed);
        var second = fixtures.capture();
        sdk.api.performPurchase({}, second);
        sdk.flush();
        assert.strictEqual(second.calls.length, 1);
        assert.strictEqual(second.calls[0].result, true);
        assert.strictEqual(sdk.calls[2].uri, 'https://dev-gateway.rocketgate.com:443' + servlet);
        assert.strictEqual(sdk.calls[3].uri, 'https://dev-gateway-16.rocketgate.com:443' + servlet);

        sdk.reply(fixtures.confirmed);
        sdk.advance(2000);
        sdk.assertIdle();
        assert.strictEqual(test.calls.length, 1);
        assert.strictEqual(test.calls[0].result, true);
        assert.strictEqual(sdk.calls[4].uri, 'https://dev-gateway-16.rocketgate.com:443' + servlet);
    });

    it('keeps the legacy public testMode shortcut as a shared service configuration change', function () {
        var sdk = createSDK();
        sdk.reply(fixtures.success);
        fixtures.invoke(sdk, 'performCardScrub', { testMode: true });
        assert.strictEqual(sdk.calls[0].uri, 'https://dev-gateway.rocketgate.com:443' + servlet);

        var callback = fixtures.capture();
        sdk.reply(fixtures.success);
        sdk.service.performCardScrub({}, {}, callback);
        sdk.flush();
        sdk.assertIdle();
        assert.strictEqual(callback.calls.length, 1);
        assert.strictEqual(sdk.calls[1].uri, 'https://dev-gateway.rocketgate.com:443' + servlet);
    });

    it('snapshots fallback hosts before an asynchronous DNS result', function () {
        var sdk = createSDK({ records: [] });
        var callback = fixtures.capture();
        sdk.reply(fixtures.success);
        sdk.service.performCardScrub({}, {}, callback);
        sdk.service.setTestMode(true, function () {});
        sdk.flush();
        sdk.assertIdle();
        assert.strictEqual(callback.calls.length, 1);
        assert.strictEqual(sdk.calls[0].uri, 'https://gateway-16.rocketgate.com:443' + servlet);
    });

    it('uses a custom URL for both the purchase and confirmation retry', function () {
        var sdk = createSDK();
        sdk.service.setTestMode(true, function () {});
        var callback = fixtures.capture();
        sdk.reply(fixtures.success);
        sdk.reply(fixtures.systemError);
        sdk.reply(fixtures.confirmed);
        sdk.api.performPurchase({ gatewayURL: 'https://custom.example:8443/api?token=synthetic' }, callback);
        sdk.flush();
        sdk.advance(2000);
        sdk.assertIdle();
        assert.strictEqual(callback.calls.length, 1);
        assert.strictEqual(callback.calls[0].result, true);
        assert.strictEqual(sdk.calls.length, 3);
        sdk.calls.forEach(function (call) {
            assert.strictEqual(call.uri, 'https://custom.example:8443/api?token=synthetic');
        });
    });
});
