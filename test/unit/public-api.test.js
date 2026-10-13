'use strict';

var assert = require('assert');
var crypto = require('crypto');
var createSDK = require('./helpers/sdk');
var fixtures = require('./helpers/fixtures');

describe('Public transaction API (unit)', function () {
    var operations = [
        ['performAuthOnly', 'CC_AUTH', {}, true],
        ['performPurchase', 'CC_PURCHASE', {}, true],
        ['performTicket', 'CC_TICKET', { referenceGUID: '1000000000000001' }],
        ['performVoid', 'CC_VOID', { referenceGUID: '1000000000000001' }],
        ['performCredit', 'CC_CREDIT'],
        ['performCardUpload', 'CARDUPLOAD'],
        ['performCardScrub', 'CARDSCRUB'],
        ['performRebillCancel', 'REBILL_CANCEL'],
        ['performRebillUpdate', 'REBILL_UPDATE'],
        ['generateXsell', 'GENERATEXSELL'],
        ['buildPaymentLink', 'CC_PURCHASE', { transactionType: 'CC_PURCHASE' }]
    ];

    operations.forEach(function (operation) {
        var method = operation[0];
        it(method + ' serializes the operation and returns the public callback contract', function () {
            var sdk = createSDK();
            sdk.reply(fixtures.success);
            if (operation[3]) sdk.reply(fixtures.confirmed);
            var result = fixtures.invoke(sdk, method, operation[2]);

            assert.strictEqual(result.result, true);
            assert.strictEqual(result.response.responseCode, '0');
            assert.strictEqual(result.response.reasonCode, '0');
            assert.strictEqual(result.response.result, 'Success');
            assert.strictEqual(result.response.guidNo, '1000000000000001');
            assert.strictEqual(result.response.authNo, '001234');
            assert.strictEqual(result.request.version, 'K2.8');
            assert.strictEqual(sdk.calls.length, operation[3] ? 2 : 1);
            assert.ok(sdk.calls[0].body.indexOf('<transactionType>' + operation[1] + '</transactionType>') !== -1);
        });

        it(method + ' rejects missing parameters without making an HTTP request', function () {
            var sdk = createSDK();
            assert.throws(function () { sdk.api[method](null, function () {}); }, /requires `params` Object/);
            assert.strictEqual(sdk.calls.length, 0);
            sdk.assertIdle();
        });
    });

    it('defers the callback until transport completes and leaves transaction parameters unchanged', function () {
        var sdk = createSDK();
        var params = { merchantID: '001', merchantCustomerID: 'A&B <customer>', amount: '1.00' };
        var original = JSON.stringify(params);
        var callback = fixtures.capture();
        sdk.reply(fixtures.success);
        sdk.api.performCardScrub(params, callback);
        assert.strictEqual(callback.calls.length, 0);
        sdk.flush();
        sdk.assertIdle();

        assert.strictEqual(callback.calls.length, 1);
        assert.strictEqual(JSON.stringify(params), original);
        assert.notStrictEqual(callback.calls[0].request, params);
        assert.strictEqual(sdk.calls[0].method, 'POST');
        assert.strictEqual(sdk.calls[0].headers['Content-Type'], 'text/xml');
        assert.strictEqual(sdk.calls[0].headers['User-Agent'], 'RG Client NodeJS K2.8');
        assert.ok(sdk.calls[0].body.indexOf('<merchantID>001</merchantID>') !== -1);
        assert.ok(sdk.calls[0].body.indexOf('A&amp;B &lt;customer&gt;') !== -1);
    });

    it('confirms a rebill update only when it requests a positive immediate charge', function () {
        var sdk = createSDK();
        sdk.reply(fixtures.success);
        sdk.reply(fixtures.confirmed);
        var result = fixtures.invoke(sdk, 'performRebillUpdate', { amount: '2.00' });
        assert.strictEqual(result.result, true);
        assert.strictEqual(sdk.calls.length, 2);
        assert.ok(sdk.calls[1].body.indexOf('<transactionType>CC_CONFIRM</transactionType>') !== -1);
    });

    it('does not confirm a zero-amount rebill update', function () {
        var sdk = createSDK();
        sdk.reply(fixtures.success);
        fixtures.invoke(sdk, 'performRebillUpdate', { amount: '0.00' });
        assert.strictEqual(sdk.calls.length, 1);
    });
});

describe('Public hosted URL helpers (unit)', function () {
    [
        ['createHostedPageUrl', 'id', 'hostedpage/servlet/HostedPagePurchase', false],
        ['createEmbeddedFieldsScript', 'merch', 'hostedpage/EmbeddedFields.jsp', true]
    ].forEach(function (operation) {
        it(operation[0] + ' encodes parameters and signs the unencoded values without exposing the secret', function () {
            var sdk = createSDK();
            var params = {};
            params[operation[1]] = '001';
            params.description = 'A&B';
            params.secret = 'synthetic-secret';
            if (operation[3]) params.dev = true;
            var calls = [];
            sdk.api[operation[0]](params, function (error, url) { calls.push({ error: error, url: url }); });
            var hash = crypto.createHash('sha1')
                .update(operation[1] + '=001&description=A&B&secret=synthetic-secret').digest('base64');
            assert.strictEqual(calls.length, 1);
            assert.strictEqual(calls[0].error, null);
            assert.strictEqual(calls[0].url, 'https://' + (operation[3] ? 'dev-secure' : 'secure') +
                '.rocketgate.com/' + operation[2] + '?' + operation[1] +
                '=001&description=A%26B&hash=' + encodeURIComponent(hash));
            assert.strictEqual(sdk.calls.length, 0);
            sdk.assertIdle();
        });
    });
});
