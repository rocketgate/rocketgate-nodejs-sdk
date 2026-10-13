'use strict';

var assert = require('assert');
var crypto = require('crypto');
var path = require('path');
var utils = require(path.join(process.env.ROCKETGATE_SDK_ROOT || path.resolve(__dirname, '../..'), 'lib/utils'));
var createSDK = require('./helpers/sdk');

describe('XML callback boundaries (unit)', function () {
    ['toXML', 'fromXML'].forEach(function (method) {
        function validInput() {
            return method === 'toXML' ? { amount: '1.00' } :
                '<gatewayResponse><responseCode>0</responseCode></gatewayResponse>';
        }

        function invalidInput() {
            if (method === 'fromXML') return null;
            return Object.defineProperty({}, 'amount', {
                enumerable: true,
                get: function () { throw new Error('synthetic serialization failure'); }
            });
        }

        it(method + ' calls its success callback once and synchronously', function () {
            var calls = [];
            utils[method](validInput(), function (error, value) {
                calls.push({ error: error, value: value });
            });
            assert.strictEqual(calls.length, 1);
            assert.strictEqual(calls[0].error, null);
            if (method === 'toXML') {
                assert.strictEqual(calls[0].value,
                    '<?xml version="1.0" encoding="UTF-8"?><gatewayRequest><amount>1.00</amount></gatewayRequest>');
            } else {
                assert.deepStrictEqual(calls[0].value, { responseCode: '0' });
            }
        });

        it(method + ' propagates a success callback exception without calling it again', function () {
            var count = 0;
            var failure = new Error('synthetic callback failure');
            assert.throws(function () {
                utils[method](validInput(), function () {
                    count++;
                    throw failure;
                });
            }, function (error) { return error === failure; });
            assert.strictEqual(count, 1);
        });

        it(method + ' reports conversion errors once and synchronously', function () {
            var calls = [];
            assert.doesNotThrow(function () {
                utils[method](invalidInput(), function (error, value) {
                    calls.push({ error: error, value: value });
                });
            });
            assert.strictEqual(calls.length, 1);
            assert.ok(calls[0].error instanceof Error);
            assert.strictEqual(calls[0].value, undefined);
        });

        it(method + ' propagates an error callback exception without calling it again', function () {
            var count = 0;
            var conversionError;
            var failure = new Error('synthetic error callback failure');
            assert.throws(function () {
                utils[method](invalidInput(), function (error) {
                    count++;
                    conversionError = error;
                    throw failure;
                });
            }, function (error) { return error === failure; });
            assert.strictEqual(count, 1);
            assert.ok(conversionError instanceof Error);
            assert.notStrictEqual(conversionError, failure);
        });
    });
});

describe('Hosted URL parameter reuse (unit)', function () {
    [
        ['createHostedPageUrl', 'id', 'hostedpage/servlet/HostedPagePurchase'],
        ['createEmbeddedFieldsScript', 'merch', 'hostedpage/EmbeddedFields.jsp']
    ].forEach(function (operation) {
        var method = operation[0];
        var field = operation[1];

        [undefined, false, true].forEach(function (dev) {
            it(method + ' preserves parameters and signatures across repeated calls with dev ' + String(dev), function () {
                var sdk = createSDK();
                var params = { description: 'A&B', secret: 'synthetic-secret' };
                params[field] = '001';
                if (dev !== undefined) params.dev = dev;
                var original = Object.assign({}, params);
                var originalKeys = Object.keys(params);
                var hashArgs = field + '=001&description=A&B' + (dev === false ? '&dev=false' : '') +
                    '&secret=synthetic-secret';
                var hash = crypto.createHash('sha1').update(hashArgs).digest('base64');
                var expected = 'https://' + (dev ? 'dev-secure' : 'secure') + '.rocketgate.com/' +
                    operation[2] + '?' + field + '=001&description=A%26B' +
                    (dev === false ? '&dev=false' : '') + '&hash=' + encodeURIComponent(hash);

                for (var i = 0; i < 2; i++) {
                    var calls = [];
                    sdk.api[method](params, function (error, url) { calls.push({ error: error, url: url }); });
                    assert.strictEqual(calls.length, 1);
                    assert.strictEqual(calls[0].error, null);
                    assert.strictEqual(calls[0].url, expected);
                    assert.deepStrictEqual(params, original);
                    assert.deepStrictEqual(Object.keys(params), originalKeys);
                }
                assert.strictEqual(sdk.calls.length, 0);
                sdk.assertIdle();
            });
        });

        it(method + ' accepts frozen caller parameters', function () {
            var sdk = createSDK();
            var params = { dev: true, secret: 'synthetic-secret' };
            params[field] = '001';
            Object.freeze(params);
            var calls = [];
            assert.doesNotThrow(function () {
                sdk.api[method](params, function (error, url) { calls.push({ error: error, url: url }); });
            });
            assert.strictEqual(calls.length, 1);
            assert.strictEqual(calls[0].error, null);
            var hash = crypto.createHash('sha1').update(field + '=001&secret=synthetic-secret').digest('base64');
            assert.strictEqual(calls[0].url, 'https://dev-secure.rocketgate.com/' + operation[2] +
                '?' + field + '=001&hash=' + encodeURIComponent(hash));
            assert.strictEqual(params.dev, true);
            assert.strictEqual(params[field], '001');
            assert.strictEqual(sdk.calls.length, 0);
            sdk.assertIdle();
        });
    });
});
