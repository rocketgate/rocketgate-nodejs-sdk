var service = require('../../lib/gatewayService'),
    Request = require('../../lib/gatewayRequest'),
    should = require('should'),
    responseSettings = require('../../config/config').responseSettings,
    time = Math.round(+new Date() / 1000),
    request;

describe('perform auth only', function() {
    before(function() {
        request = new Request();
        request.merchantID = 1;
        request.merchantPassword = "testpassword";
        request.merchantCustomerID = time + ".JSTest";
        request.merchantInvoiceID = time + ".Test";
        request.currency = "USD";
        request.amount = "9.99";
        request.cardNo = "4111-1111-1111-1111";
        request.expireMonth = "02";
        request.expireYear = "2025";
        request.cvv2 = "999";
        request.customerFirstName = "Joe";
        request.customerLastName = "JSTester";
        request.email = "nodetest@fakedomain.com";
        request.ipAddress = "68.224.133.117";
        request.billingAddress = "123 Main St.";
        request.billingCity = "Las Vegas";
        request.billingState = "NV";
        request.billingZipCode = "89141";
        request.billingCountry = "US";
        request.avsCheck = "IGNORE";
        request.cvv2Check = "IGNORE";
        request.scrub = "IGNORE";
        request.transactionType = "CC_PURCHASE";

        service.setTestMode(true, function(err, result) {
            if (err) throw err;
        });
    });

    it ('should perform build payment link', function (done) {
        service.buildPaymentLink(request, {}, function(results, request, response){
            results.should.not.equal(null);
            response[responseSettings.RESPONSE_CODE].should.equal('0');
            console.log('PAYMENT_LINK_URL: ' + response[responseSettings.PAYMENT_LINK_URL]);
            done();
        });
    });
});
