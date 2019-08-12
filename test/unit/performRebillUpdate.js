var service = require('../../lib/gatewayService'),
    Request = require('../../lib/gatewayRequest'),
    should = require('should'),
    responseSettings = require('../../config/config').responseSettings,
    time = Math.round(+new Date() / 1000),
    request,
    cardHash;

describe('perform rebill update', function() {
    this.timeout(0);

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
        request.rebillFrequency = 'MONTHLY';
        request.amount = "5.55";
        request.cardNo = "4111-1111-1111-1111";
        request.expireMonth = "02";
        request.expireYear = "2020";
        request.cvv2 = "999";

        service.setTestMode(true, function(err, result) {
            if (err) throw err;
        });
    });

    it ('should get rebill status of active subscription', function (done) {
        service.performPurchase(request, {}, function(results, request, response) {
            // perform purchase then get status
            request = new Request();
            request.merchantID = 1;
            request.merchantPassword = "testpassword";
            request.merchantCustomerID = time + ".JSTest";
            request.merchantInvoiceID = time + ".Test";

            service.performRebillUpdate(request, {}, function(results, request, response) {
                results.should.equal(true);
                response[responseSettings.RESPONSE_CODE].should.equal('0');
                done();
            });
        });
    });

    it ('should get rebill status of cancelled subscription', function (done) {
        service.performPurchase(request, {}, function(results, request, response) {
            // perform purchase then get status
            request = new Request();
            request.merchantID = 1;
            request.merchantPassword = "testpassword";
            request.merchantCustomerID = time + ".JSTest";
            request.merchantInvoiceID = time + ".Test";

            //cancel subscription
            service.performRebillCancel(request, {}, function(results, request, response) {
                request = new Request();
                request.merchantID = 1;
                request.merchantPassword = "testpassword";
                request.merchantCustomerID = time + ".JSTest";
                request.merchantInvoiceID = time + ".Test";

                // get status
                service.performRebillUpdate(request, {}, function(results, request, response) {
                    results.should.equal(true);
                    response[responseSettings.RESPONSE_CODE].should.equal('0');
                    done();
                });
            });

        });
    });

    it ('should update the personal info of a customer', function (done) {
        service.performPurchase(request, {}, function(results, request, response) {
            // perform purchase then update
            request = new Request();
            request.merchantID = 1;
            request.merchantPassword = "testpassword";
            request.merchantCustomerID = time + ".JSTest";
            request.merchantInvoiceID = time + ".Test";
            request.email = "node_updated@fakedomain.com";
            request.username = "node_added_username";
            request.customerPassword = "node_added_password";

            service.performRebillUpdate(request, {}, function(results, request, response) {
                results.should.equal(true);
                response[responseSettings.RESPONSE_CODE].should.equal('0');
                done();
            });
        });
    });
});
