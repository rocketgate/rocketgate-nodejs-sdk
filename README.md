![rocketgate-nodejs-sdk](http://rocketgate.com/images/logo_rocketgate.png)

# RocketGate Node.js Gateway SDK

A JavaScript version of the RocketGate SDK

The Gateway Service communicates with servers within the RocketGate network to perform standard credit card transactions, i.e. auth-only, ticket, void, etc.

## Install 

* npm install
* mocha

## Gateway Service Methods

Most methods accept `request`, `response`, and `callback` parameters.
* The `request` parameter is an object containing the information being sent to RocketGate. The `request` object is created by GatewayRequest (see below) and will always contain a `version` property.
* The `response` parameter is initially empty and eventually contains RocketGate's response to the request.
* The `callback` function returns the data to the function that called it. The callback generally includes 3 parameters:
    * `result` - boolean value indicating whether the transaction was performed successfully and accepted by the banking institution.
    * `request` - updated `request` object
    * `response` - if the `result` is true, `response` contains details including the transaction ID, auth-code, etc. If a “false” value is returned, the transaction failed and response contains an explanation of the failure.

### performAuthOnly
Submit an auth-only transaction to the RocketGate system.
* **Required GatewayRequest Parameters**
    * merchantID
    * merchantPassword
    * amount
    * cardHash or cardNo
    (If both are present, the `cardNo` element takes precedence.)
        * if cardHash:
            * merchantCustomerID
        * if cardNo:
            * expireMonth
            * expireYear

### performPurchase
Submit a complete auth-capture transaction to the RocketGate system. Purchases can be made using a full credit card number or a card hash. In effect, this method performs a combined auth-only and ticket operation.

####Card Hash Purchase  
Make a purchase with a card on file.
* **Required GatewayRequest Parameters**
    * merchantID
    * merchantPassword
    * merchantCustomerID
    * amount
    * cardHash
    * cvv2

####ACH Purchase
Make a purchase using a bank account.
* **Required GatewayRequest Parameters**
    * merchantID
    * merchantPassword
    * amount
    * accountNo or cardHash
    (If both the `accountNo` and `cardHash` elements are used in the same request, `accountNo` takes precedence.)  
        * if accountNo:
            * routingNo
            * ssNumber (?)
        * if cardHash:
            * merchantCustomerID

### performTicket
Submit a ticket transaction to settle a previous auth-only transaction.
* **Required GatewayRequest Parameters**
    * merchantID
    * merchantPassword
    * referenceGUID (transaction ID)

### performCredit
Submit a credit transaction to the RocketGate system.
* **Required GatewayRequest Parameters**
    * merchantID
    * merchantPassword
    * referenceGUID (transaction ID) of previous ticket or purchase OR card number, expiration, amount, etc. of credit

### ￼performVoid
Submit a void transaction for a previous auth-only, ticket, purchase, or credit transaction.
* **Required GatewayRequest Parameters**
    * merchantID
    * merchantPassword
    * referenceGUID (transaction ID)


### performCardScrub
Submit purchase information to the RocketGate system for validation and fraud analysis. The information is not transmitted to the bank. However, fraud scores and card information, such as the country of origin, are returned. In effect, this method performs a fraud scrub independent of a financial transaction.
* **Required GatewayRequest Parameters**
    * merchantID
    * merchantPassword
    * cardNo  
Note: providing more information (card number, customer billing and email addresses, customer IP address, etc.) in the request will provide more detailed and accurate results.
￼

### performRebillCancel
Schedules the termination of a recurring billing. The selected subscription/recurring billing will be scheduled to terminate at the next rebilling date.
* **Required GatewayRequest Parameters**
    * merchantID
    * merchantPassword
    * merchantCustomerID
* **Notes**
    * `merchantInvoiceID` can be used to select a specific subscription if a customer has more than one. If it is omitted, all subscriptions for the specified customer will be scheduled for termination.
    * `rebillEndDate` element is optional and is submitted in order to clear a an existing cancel date that has not yet occurred.

### performRebillUpdate
Modifies the scheduling and rates of a recurring billing. Optionally performs a prorated billing as part of the modification.
* **Required GatewayRequest Parameters**
    * merchantID
    * merchantPassword
    * merchantCustomerID
    * merchantInvoiceID
* **Notes**
    * `rebillAmount`, `rebillFrequency`, `rebillStart`, and `rebillEndDate` can be used to modify specific terms of the recurring billing operation.
    * `amount` can be used to request a prorated charge as part of the subscription modification.

### setReadTimeout
Set timeout for RocketGate server response.
* **Required Parameters**
    * timeout (seconds)
    * callback

### setTestMode
Turn on/off testing mode. In testing mode, transactions are sent to RocketGate test servers.
* **Required Parameters**
    * bool (true = test mode on)
    * callback

### setHost  
Set the host used by the service.
* **Required Parameters**
    * hostName
    * callback

### setProtocol
Set the communications protocol used by the service.
* **Required Parameters**
    * protocol
    * callback

### setPortNo
Set the port number used by the service.
* **Required Parameters**
    * portNo
    * callback

### setServlet
Set the servlet used by the service.
* **Required Parameters**
    * servlet
    * callback

### setConnectTimeout
Set the timeout used during connection to the servlet.
* **Required Parameters**
    * timeout  (seconds)
    * callback


## GatewayRequest Parameters
An object containing the information for a credit card transaction request that is submitted to the RocketGate network. Details of the transaction, i.e. customer ID, amount, etc., are embedded in the GatewayRequest object by the client application prior to calling a GatewayService transaction method.

Fields below are referenced in `./config/rgProperties.json`

### Fields

**accountNo**  
Customer’s checking/savings account number used in ACH transactions.

* **required:** only for ACH purchases;  
Either the `accountNo` or `cardHash` element is required in all ACH purchase transactions. If both the `accountNo` and `cardHash` elements are used in the same request, the `accountNo` element takes precedent.

**affiliate**  
This argument carries a merchant defined affiliate code. This data is displayed in a number of reports, such as the chargeback and sales reports, and in the customer details section of the support tools.
* **required:** no
* **max chars:** 32


￼**amount**  
Value of the transaction in X.XX format.
* **required:** for `peformPurchase` and `performAuthOnly`; can be omitted for void and credit transactions as well as credit card ticket transactions if the amount is the same as the original purchase or auth-only transaction.
* **values:** must be between 1.00 and 999,999.99 inclusive; $0 authOnly (card validation) when available through the back end processor.
* **max chars:** 32

**avsCheck**  
Turn on/off Address Verification. By default, Address Verification is off. The following table summarizes the valid values for this element.

Value   | Meaning
:-----: | -----
YES     | Address Verification is to be performed.
NO      | Address Verification is not to be performed.
IGNORE  | Perform Address Verification and return the result code, but do not take action based upon results.
* **required:** no

**billingAddress**  
Customer’s billing street address.
* **required:** no, unless Address Verification (`avsCheck`) is enabled.
* **max chars:** 128

**billingCity**  
Customer’s billing city.
* **required:** no, unless Address Verification (`avsCheck`) is enabled.
* **max chars:** 32

**billingState**  
Customer’s billing state.
* **required:** no, unless Address Verification (`avsCheck`) is enabled.
* **max chars:** 32

**billingZipCode**  
Customer’s billing zip code.
* **required:** no, unless Address Verification (`avsCheck`) is enabled.
* **max chars:** 32

**billingCountry**  
Customer’s billing country.
* **required:** no, unless Address Verification (`avsCheck`) is enabled.
* **max chars:** 2


**billingType**  
Indicator for type of billing operation.
* **required:** no
* **values:** any single character value. By convention, the RocketGate system uses the following indicators:

Value         | Meaning
:----:        | ----
S             | One time non-membership sale (default)
I             | Initial membership billing/signup
T             | Trial membership
C             | Conversion of trial to full membership
U             | Instant upgrade of trial membership to full membership
R             | Standard rebill of membership
* **max chars:** 1


**cardHash**  
A one-way hash value representing a card number. Returned for each credit card transaction. This hash value can be submitted in subsequent transactions in place of other credit card elements, i.e. `cardNo`, `expireMonth`, `expireYear`.

To be valid, the `cardHash` element must be used in conjunction with the `merchantCustomerID` element. When the `cardHash` element is used, it is not necessary to submit values for the `expireMonth` and `expireYear` elements. However, values can be submitted for these elements in order to update the expiration date of the associated card in the RocketGate database.

* **required:** for auth-only and purchase transactions that do not include a `cardNo`


**cardNo**  
Customer’s credit card number.
* **required:** for auth-only and purchase transactions that do not include a `cardHash`


**cloneCustomerRecord**  
This is a flag value. When enabled, the customer data (card, address, etc.) identified by `merchantCustomerID` will be copied and used to make a purchase as the customer specified by `cloneToCustomerID`. In the process, a new customer record will be created for `cloneToCustomerID`.

The system checks to ensure the `merchantCustomerID` actually exists. It also verifies that the value of `cloneToCustomerID` is not the same as `merchantCustomerID`.

* **required:** no
* **values:** `TRUE`, `ON`, `YES`, or `1` to enable the cloning function.

**cloneToCustomerID**  
This is the id of the customer that is to be created. If the purchase or auth-only transaction is successful, a new customer record will be created for `cloneToCustomerID`. If the transaction does not succeed, no new record is created.

If the parameters specified in `cloneCustomerRecord` and/or `cloneToCustomerID` are invalid, error code 451 will be returned.

**currency**  
Currency of the transaction that is to be processed against the user’s credit card.

* **required:**  no; if omitted, the transaction will be conducted in US Dollars (USD).
* **values:** For a complete list of valid currency codes, please refer to the RG Support document entitled “Currency Codes for Multi-currency Processing”.

**customerFirstName**  
Cardholder’s first name.  
* **required:** no
* **max chars:** 64

**customerLastName**  
Cardholder’s last name.  
* **required:** no
* **max chars:** 64

**customerPhoneNo**  
Cardholder’s phone number.  
* **required:** no

**customerPassword**  
Cardholder’s password.

* **required:** no; typically only provided when RocketGate is providing customer support services which involve password updates.  

**cvv2**  
CVV2 value from customer’s credit card.
* **required:** no

**cvv2Check**  
Flag calue to turn on/off CVV2 Verification.
* **required:** no; off by default
* **values:**

Value   | Meaning
:----:  | ----
YES     | CVV2 Verification is to be performed.
NO      | CVV2 Verification is not to be performed.
IGNORE  | Perform CVV2 Verification and return the result code, but do not take action based upon results.


**email**  
Customer email address.
* **required:** no

**expireMonth**  
Customer card expiration month.
* **required:** required for all credit card transactions in which the `cardNo` element is used. Optional for credit card transaction that use the `cardHash` element.
* **values:** integer value in the range of 1 through 12

**expireYear**  
Customer card expiration year.
* **required:** required for all credit card transactions in which the `cardNo` element is used. This element is optional for credit card transaction that use the `cardHash` element.
* **values:** integer value in the range 7 through 99, or 2007 through 2099


**generatePostback**  
Generate a postback from RocketGate to Merchant’s pre-configured postback URL. This is applicable to Void/Credits, Rebills, and Xsell requests.
* **required:** no
* **values:** ?
* **max chars:** ?

**iovationBlackBox**  
Iovation device fingerprinting black box data from ReputationShield client.
* **required:** no
* **values:** ?

**iovationRule**  
Iovation business rule id used to obtain a recommendation
* **required:** no
* **values:** ?

**ipAddress**  
Customer’s IP address.
* **required:** no
* **max chars:** 15

**merchantAccount**:  
Merchant account to which transaction is to be applied. This is a merchant account number assigned to an account within the RocketGate network.
* **required:** no; if omitted, the RocketGate network will assign the transaction to an appropriate account based upon the card type and a load balancing algorithm.

**merchantCustomerID**  
Customer ID of cardholder in merchant’s internal systems.
* **required:** required only for recurring billing and credit card transaction that use the `cardHash` element
* **max chars:** 36

**merchantDescriptor**  
MMerchant name to be displayed on cardholder’s statement. The value provided overrides the default descriptor provided by the bank and/or processor.

Note: This feature is not supported by all banks or processors. Please check with RocketGate customer service before using.
* **required:** no
* **max chars:** 40

**merchantInvoiceID**  
Invoice or transaction ID applied to transaction by merchant’s internal systems.
* **required:** required only for recurring billing and is used as an ID for rebill and cancel postbacks allowing you to differentiate between various subscriptions a customer may have.
* **max chars:** 36

**merchantID**  
Merchant’s RocketGate identification number.
* **required:** YES

**merchantPassword**  
Validation password assigned to the merchant within the RocketGate network.
* **required:** YES

**merchantProductID**  
Optional product identification number
* **required:** no
* **max chars:** 36

**merchantSiteID**:  
Merchant's site identification number.
* **required:** no
* **values:** integer value from 0 to 10000

**omitReceipt**  
This flag is used to disable the optional Email Receipts functionality. Email receipts must first be setup in Mission Control at which point all transactions receive receipts.
* **required:** no
* **values:** when set to `TRUE`, `ON`, or `1`, this will disable sending the receipt.

**partialAuthFlag**  
Specifies whether a partial authorization is acceptable for the Auth-only or Purchase transaction. By default, partial authorizations are disabled.

When enabled, a transaction can be completed successfully for an amount that is less than the amount requested. When disabled, a transaction must be completed or the full requested amount in order to be successful. In either case, the actual settled amount is returned in the response in the SETTLED_AMOUNT parameter.
* **required:** no
* **values:** values of `TRUE`, `ON`, `YES`, or `1` enable the use of partial authorizations


**rebillAmount**  
If recurring charge, dollar value of recurring charges. This value may be different than the initial amount specified in AMOUNT.
* **required:** no

**rebillCount**  
The number of times to rebill before automatically cancelling.
* **required:** no
* **values:** integers; `0` can be used to denote a membership that does not recur.

**rebillEndDate**  
Scheduled end date for recurring charges.
* **required:** no; if omitted, rebilling will continue until it is cancelled due to a customer request or billing failure, e.g. expired card.
* **values:** date value specified in YYYY-MM-DD format; When used with `peformRebillUpdate` or `peformRebillCancel`, a value of `CLEAR` indicates that a previous cancel request should be cleared.


**rebillFrequency**  
Specifies the frequency of the recurring charges.
* **required:** no
* **values:** A numeric value specifies the frequency of rebilling in DAYS. Other valid values are:

Value           | Meaning
----            | ----
MONTHLY         | Rebilling occurs once per month.
QUARTERLY       | Every 3 months
SEMI-ANNUALLY   | Every 6 months
ANNUALLY        | Every 12 months

**rebillResume**  
Resubilling on suspended subscription. Used with the `performRebillUpdate` function. When set to TRUE, causes the rebilling to resume for the subscription identified by the `merchantInvoiceID` parameter.
* **required:** no
* **values:** `TRUE`

**rebillStart**  
If recurring charge, number of days after initial transaction until rebilling begins.
* **required:** no;
    * If omitted, value provided for `rebillFrequency` determines the starting date for rebilling.
    * If omitted from a request that contains `rebillResume`, rescheduling defaults to AUTO.
    * If the transaction is an update to an existing recurring charge and the desire is to automatically increment the REBILL_DATE to today + the configured/requested `rebillFrequency`, this argument can be set to “AUTO”.
* **values:**

Value           | Meaning
----            | ----
Integer greater than 0 and less than 550 | Causes rebilling to be scheduled “X” number of days from the current day. For example, if the value 5 is provided, the next rebill will occur 5 days from the current day.
AUTO            | Causes rebilling to be scheduled as an offset from the current day. For example, if a membership is scheduled for monthly billing, the next rebill will occur one month from the current day, i.e. the day the `rebillResume` is executed.
TODAY or NOW    | Causes the next rebilling to be executed immediately.

**rebillSuspend**  
Suspend Subscription. When a subscription is suspended, no rebilling is performed.
* **required:** no; used with the `performRebillUpdate` function
* **values:** When set to `TRUE`, causes the subscription identified by the `merchantInvoiceID` parameter to be suspended.

**referralNo**
?


**referringMerchantID**
?


**referredCustomerID**
?


**routingNo**  
Checking/Savings Routing Number used in ACH transactions.
* **required:** only for ACH transactions


**savingsAccount**  
Boolean value that indicates if this account is a Checking or Savings account. Accounts default to 'checking account'.  If the account is a savings account, set this parameter to `TRUE`.
* **required:** no
* **values:**

Value   | Meaning
---     | ---
FALSE   | Account is a Checking Account.
TRUE    | Account is a Savings Account.

**scrub**  
Fraud scrubbing enabled/disabled/ignored. By default, fraud scrubbing is not performed.
* **required:** no
* **values:**

Value       | Meaning
:----:      | ----
YES         | Fraud scrubbing is to be performed.
NO          | Fraud scrubbing is not to be performed.
IGNORE      | Perform fraud scrubbing and return the result code, but do not take action based upon results.


**ssNumber**  
Last 4 digits of Social Security number for ACH transactions
* **required:** SBW requires the last four digits of the customer's Social Security Number.
* **max chars:** 4

**referenceGUID (transaction ID)**  
Unique identification number of a transaction number to be voided, credit, or ticketed.
* **required:** only for void and ticket transactions (optional for credit transactions)

**udf01**  
User data field 1 provided as a convenience to the merchant.
* **required:** no
* **max chars:** 36

**udf02**  
User data field 2 provided as a convenience to the merchant.
* **required:** no
* **max chars:** 1024

**username**  
Customer’s username within merchant’s internal system.
* **required:** no


## GatewayRequest Examples
Following are some examples of the use of the parameters for various types of transactions. Note that the customer ID and original invoice ID are required to perform any modifications to a subscription.

###Initial subscription purchase
**Rebilling trial**
Scenario: User wishes to purchase a 3-day trial at $1.00. Rebills monthly at $40.00.

    request.merchantCustomerID = "cust-1";
    request.merchantInvoiceID = "invoice-1";
    request.amount = "1.00";
    request.rebillStart = "3";
    request.rebillAmount = "40.00";
    request.rebillFrequency = "MONTHLY";

###Upgrade membership

**Full/Instant Upgrade**  
Scenario: User wishes to upgrade from a $40/month membership to a $50/month membership. The example code below will upgrade membership immediately, stop the trial period and change the $40 subscription to a $50 monthly subscription. Billing begins immediately at new price. The next rebill date is set equal to today plus one month.

    request.merchantCustomerID = "cust-1";
    request.merchantInvoiceID = "invoice-1";
    request.rebillStart = "AUTO";
    request.rebillAmount = "40.00";

**Pro-rated/Instant Upgrade**  
Scenario: Trial period has limited access – user wishes to have the increased access associated with the full (non-trial) membership. End trial membership immediately and begin full (non- trial) membership. The example code below will charge pro-rated price for balance of trial period. Leave rebill price, date, and frequency unchanged (user will be billed for the full membership on the date that the renewal date – the date that the trial was set to renew to a full membership).

    request.merchantCustomerID = "cust-1";
    request.merchantInvoiceID = "invoice-1";
    request.amount = "1.75";


**Zero dollar upgrade**  
Scenario: User wants to upgrade to a membership that is billed quarterly. The example code below will upgrade the subscription to $200.00 billed quarterly. Change takes effect at renewal date.

    request.merchantCustomerID = "cust-1";
    request.merchantInvoiceID = "invoice-1";
    request.rebillAmount = "200.00";
    request.rebillFrequency = "QUARTERLY";

**Cancel Promo**  
User indicates that he wants to cancel – he is then presented with a promotional membership product (in this example a $100 quarterly product) that induces him to keep his membership active. The example code below will modify his existing subscription to one that is $100 billed quarterly. Change takes effect at renewal date.

    request.merchantCustomerID = "cust-1";
    request.merchantInvoiceID = "invoice-1";
    request.rebillAmount = "100.00";
    request.rebillFrequency = "QUARTERLY";

## Hosted Page

### performPurchase
Submit a complete auth-capture transaction to the RocketGate system. Purchases can be made using a full credit card number or a card hash. In effect, this method performs a combined auth-only and ticket operation.

#### Card Hash Purchase  
Make a purchase with a card on file.
* **Required Parameters**
    * id (merchant's customer id; max-length 36 chars)
    * merch (merchant's RocketGate id)
    * amount
    * purchase (flag indicating whether transaction is a purchase; valid values: `TRUE`, `YES`, `ON`, `FALSE`, `NO`, `OFF`)
    * hash
* **Optional Parameters**
    * dev (boolean flag to indicate whether to send to dev or prod server)
    * currency (currency code; default is USD)
    * method (billing method; valid values: `CC`, `DEBIT`)
    * fname (cardholder’s first name)
    * lname (cardholder’s last name)
    * address (cardholder’s billing street address; required if AVS is enabled)
    * city (cardholder’s billing city; required if AVS is enabled)
    * state (cardholder’s billing state; required if AVS is enabled)
    * zip (cardholder’s billing zip code; required if AVS is enabled)
    * country (cardholder’s billing country; required if AVS is enabled)
    * avs (address verification flag; valid values: `YES`, `NO`, `IGNORE`)
    * scrub
    * email
    * acct
    * invoice
    * lang
    * style
    * udf01
    * udf02
    * rebill-amount
    * rebill-count
    * rebill-start
    * rebill-freq
    * mp
    * username
    * pw
    * country-code
    * prodid
    * siteid
    * descriptor
    * tos
    * success
    * fail
