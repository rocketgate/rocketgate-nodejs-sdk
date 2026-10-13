'use strict';

var assert = require('assert');
var createSDK = require('./helpers/sdk');
var fixtures = require('./helpers/fixtures');

describe('XML dependency compatibility (unit)', function () {
    it('preserves response strings and the existing named and numeric entity behavior', function () {
        var sdk = createSDK();
        sdk.reply('<?xml version="1.0" encoding="UTF-8"?><gatewayResponse>' +
            '<responseCode>0</responseCode><reasonCode>0</reasonCode>' +
            '<guidNo>9999999999999999</guidNo><authNo>001234</authNo>' +
            '<settledAmount>0.00</settledAmount><merchantCustomerID>000123</merchantCustomerID>' +
            '<processorResponseText>A&amp;B &lt;VIP&gt; &quot;quoted&quot; &apos;ok&apos; caf\u00e9 \ud83d\ude00</processorResponseText>' +
            '<numericEntityText>caf&#233; &#x1F600;</numericEntityText>' +
            '<emptyField/></gatewayResponse>');
        var result = fixtures.invoke(sdk, 'performCardScrub', {});
        assert.strictEqual(result.result, true);
        assert.strictEqual(result.response.guidNo, '9999999999999999');
        assert.strictEqual(result.response.authNo, '001234');
        assert.strictEqual(result.response.settledAmount, '0.00');
        assert.strictEqual(result.response.merchantCustomerID, '000123');
        assert.strictEqual(result.response.processorResponseText, 'A&B <VIP> "quoted" \'ok\' caf\u00e9 \ud83d\ude00');
        assert.strictEqual(result.response.numericEntityText, 'caf&#233; &#x1F600;');
        assert.strictEqual(result.response.emptyField, '');
    });

    it('serializes escaped text, zero amounts, and optional values without changing caller input', function () {
        var sdk = createSDK();
        var params = {
            merchantCustomerID: 'A&B <VIP> "quoted" \'ok\' caf\u00e9 \ud83d\ude00',
            amount: '0.00', zeroField: 0, falseField: false, emptyField: '', omittedField: undefined
        };
        var original = Object.assign({}, params);
        sdk.reply(fixtures.success);
        var result = fixtures.invoke(sdk, 'performCardScrub', params);
        var xml = sdk.calls[0].body;
        assert.strictEqual(result.result, true);
        assert.ok(xml.indexOf('<merchantCustomerID>A&amp;B &lt;VIP&gt; &quot;quoted&quot; &apos;ok&apos; caf\u00e9 \ud83d\ude00</merchantCustomerID>') !== -1);
        assert.ok(xml.indexOf('<amount>0.00</amount>') !== -1);
        assert.ok(xml.indexOf('<zeroField>0</zeroField>') !== -1);
        assert.ok(xml.indexOf('<falseField>false</falseField>') !== -1);
        assert.ok(xml.indexOf('<emptyField/>') !== -1);
        assert.strictEqual(xml.indexOf('omittedField'), -1);
        assert.deepStrictEqual(params, original);
    });

    it('returns a structured read error when the parser rejects a dangerous property name', function () {
        var sdk = createSDK();
        sdk.reply('<gatewayResponse><responseCode>0</responseCode><reasonCode>0</reasonCode>' +
            '<__proto__><xmlProbe>unexpected</xmlProbe></__proto__></gatewayResponse>');
        var result = fixtures.invoke(sdk, 'performCardScrub', { gatewayServer: 'custom.example' });
        assert.strictEqual(result.result, false);
        assert.strictEqual(result.response.responseCode, '3');
        assert.strictEqual(result.response.reasonCode, '304');
        assert.strictEqual(result.response.exception, "Can't parse response body as XML");
        assert.strictEqual(Object.prototype.xmlProbe, undefined);
        assert.strictEqual(sdk.calls.length, 1);
    });
});
