var service = require('../../lib/gatewayService'),
    Request = require('../../lib/gatewayRequest'),
    should = require('should'),
    responseSettings = require('../../config/config').responseSettings,
    time = Math.round(+new Date() / 1000),
    request,
    request2,
    cardHash;

describe('perform generateXsell', function() {
    before(function() {
        request = new Request();
        request.merchantID = 1;
        request.merchantPassword = "testpassword";
        request.merchantCustomerID = time + ".JSTest";
        request.merchantInvoiceID = time + "NODE.test";
        
        request.currency = "USD";
        request.amount = "3.00";                // bill $3.00 now
        request.rebillStart = "3";              // Rebill in 3x days
        request.rebillAmount = "11.99";         // Rebill at $9.99
        request.rebillFrequency = 'MONTHLY';    // Ongoing renewals monthly

        request.cardNo = "4111-1111-1111-1111";
        request.expireMonth = "02";
        request.expireYear = "2020";
        request.cvv2 = "999";
        
        request.customerFirstName = "Joe";
        request.customerLastName = "JSTester";
        request.email = "nodetest2222@fakedomain.com";


        //	Setup test parameters in the service and request.
        service.setTestMode(true, function(err, result) {
            if (err) throw err;
        });
    });

        //
        //	Perform the Purchase transaction.
        //
    it ('should perform a purchase', function (done) {
        service.performPurchase(request, {}, function(results, request, response) {
            results.should.not.equal(null);
            response[responseSettings.RESPONSE_CODE].should.equal('0');
            cardHash = response.cardHash;
            done();
        });
    });

        // 
        // Update Sticky MID
	    //
	    //  This would normally be two separate processes, 
	    //  but for example's sake is in one process (thus we clear and set a new GatewayRequest object)
	    //  The key values required are MERCHANT_CUSTOMER_ID  and MERCHANT_INVOICE_ID
        //
        
        // Setup New request for Xsell transaction
        request2 = new Request();

        // $1.00 Test
        request2.merchantID = 1;
        request2.merchantPassword = "testpassword";
        request2.merchantCustomerID = time + ".JSTest";
        request2.merchantInvoiceID = time + "NODE.test";
        request2.currency = "USD";
        request2.amount = "1.00";               // bill $1.00
        request2.rebillStart = "4";             // Rebill in 4x days
        request2.rebillAmount = "7.99";         // Rebill at $7.99
        request2.rebilFrequency = "MONTHLY";    // Ongoing renewalas monthly
   
    it ('should perform a Xsell', function (done) {
        service.GenerateXsell(request2, {}, function (results, request, response) {
            results.should.not.equal(null);
            response[responseSettings.RESPONSE_CODE].should.equal('0');
            done();
        });
    });
});
