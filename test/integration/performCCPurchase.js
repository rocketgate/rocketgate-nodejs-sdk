var service = require('../../lib/gatewayService'),
    Request = require('../../lib/gatewayRequest'),
    should = require('should'),
    responseSettings = require('../../config/config').responseSettings,
    time = Math.round(+new Date() / 1000),
    request,
    cardHash;

describe('perform a credit card purchase', function() {
    beforeEach(function() {
        request = new Request();
        request.merchantID = 1;
        request.merchantPassword = "testpassword";
        request.merchantCustomerID = time + ".JSTest";
        request.merchantInvoiceID = time + ".Test";
        request.currency = "USD";
        request.amount = "9.99";
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

        service.setTestMode(true, function(err, result) {
            if (err) throw err;
        });
    });

    it ('should perform a non-rebilling cc purchase', function (done) {
        request.cardNo = "4111-1111-1111-1111";
        request.expireMonth = "02";
        request.expireYear = "2020";
        request.cvv2 = "999";

        service.performPurchase(request, {}, function(results, request, response) {
            results.should.not.equal(null);
            response[responseSettings.RESPONSE_CODE].should.equal('0');
            done();
        });
    });

    it ('should perform a rebilling cc purchase', function (done) {
        request.cardNo = "4111-1111-1111-1111";
        request.expireMonth = "02";
        request.expireYear = "2020";
        request.cvv2 = "999";
        request.rebillStart = "3";
        request.rebillFrequency = 'MONTHLY';
        request.amount = "5.55";

        service.performPurchase(request, {}, function(results, request, response) {
            results.should.not.equal(null);
            response[responseSettings.RESPONSE_CODE].should.equal('0');
            cardHash = response.cardHash;
            done();
        });
    });

    it ('should perform a purchase using a card hash', function (done) {
        request.cvv2 = "999";
        request.cardHash = cardHash;

        service.performPurchase(request, {}, function(results, request, response) {
            results.should.not.equal(null);
            response[responseSettings.RESPONSE_CODE].should.equal('0');
            done();
        });
    });
});
