var _request = require('request'),
    serviceSettings = require('../config/config').serviceSettings,
    responseSettings = require('../config/config').responseSettings,
    utils = require('./utils');

function GatewayService(options) {
    'use strict';

    var publicAPI,
        gatewaySettings = {
            testMode: false,
            rocketGateDNS: serviceSettings.LIVE_HOST,
            rocketGateHost: [serviceSettings.LIVE_HOST_16, serviceSettings.LIVE_HOST_17],
            rocketGateServlet: serviceSettings.ROCKETGATE_SERVLET,
            rocketGateProtocol: serviceSettings.ROCKETGATE_PROTOCOL,
            rocketGatePortNo: serviceSettings.ROCKETGATE_PORTNO,
            rocketGateConnectTimeout: serviceSettings.ROCKETGATE_CONNECT_TIMEOUT,
            rocketGateReadTimeout: serviceSettings.ROCKETGATE_READ_TIMEOUT
        };

    /**
     * Turn testing mode on or off. By default, testing mode is off.
     * @param {Boolean}     bool
     * @param {Function}    callback
     */
    function setTestMode(bool, callback) {
        if (bool) {
            gatewaySettings.testMode = true;
            gatewaySettings.rocketGateHost = [ serviceSettings.TEST_HOST ];
            gatewaySettings.rocketGateDNS = serviceSettings.TEST_HOST;

            callback(null, true);
        } else {
            callback('required parameter `bool` not set', false);
        }
    }

    /**
     * Set the host used by the service.
     *
     * @param {String}   hostName
     * @param {Function} callback
     */
    function setHost(hostName, callback) {
        if (hostName) {
            gatewaySettings.rocketGateHost = hostName;
            gatewaySettings.rocketGateDNS = hostName;
            callback(null, true);
        } else {
            callback('required parameter `hostName` not set', false);
        }
    }

    /**
     * Set the communications protocol used by the service.
     *
     * @param {String}   protocol
     * @param {Function} callback
     */
    function setProtocol(protocol, callback) {
        if (protocol) {
            gatewaySettings.rocketGateProtocol = protocol;
            callback(null, true);
        } else {
            callback('required parameter `protocol` not set', false);
        }
    }

    /**
     * Set the port number used by the service.
     * @param {String}   portNo
     * @param {Function} callback
     */
    function setPortNo(portNo, callback) {
        if (portNo) {
            gatewaySettings.rocketGatePortNo = portNo;
            callback(null, true);
        } else {
            callback('required parameter `portNo` not set', false);
        }
    }

    /**
     * Set the servlet used by the service.
     * @param {String}   servlet
     * @param {Function} callback
     */
    function setServlet(servlet, callback) {
        if (servlet) {
            gatewaySettings.rocketGateServlet = servlet;
            callback(null, true);
        } else {
            callback('required parameter `servlet` not set', false);
        }

    }

    /**
     * Set the timeout used during connection to the servlet.
     * @param {Number}   timeout  (seconds)
     * @param {Function} callback
     */
    function setConnectTimeout(timeout, callback) {
        if (timeout) {
            timeout = parseInt(timeout, 0);
            if (timeout > 0) {
                gatewaySettings.rocketGateConnectTimeout = timeout;
                callback(null, true);
            } else {
                callback('parameter `timeout` must be greater than zero', false);
            }
        } else {
            callback('required parameter `timeout` not set', false);
        }
    }

    /**
     * Set the timeout used while waiting for the servlet to answer.
     * @param {Number}   timeout  (seconds)
     * @param {Function} callback
     */
    function setReadTimeout(timeout, callback) {
        if (timeout) {
            timeout = parseInt(timeout, 0);
            if (timeout > 0) {
                gatewaySettings.rocketGateReadTimeout = timeout;
                callback(null, true);
            } else {
                callback('parameter `timeout` must be greater than zero', false);
            }
        } else {
            callback('required parameter `timeout` not set', false);
        }
    }

    /**
     * Send transaction to the RocketGate server
     * @param {String}   serverName
     * @param {Object}   request
     * @param {Object}   response
     * @param {Function} callback
     */
    function sendTransaction(serverName, request, response, callback) {
        var urlServlet = gatewaySettings.rocketGateServlet,
            urlProtocol = gatewaySettings.rocketGateProtocol,
            urlPortNo = gatewaySettings.rocketGatePortNo,
            connectTimeout = gatewaySettings.rocketGateConnectTimeout,
            readTimeout = gatewaySettings.rocketGateReadTimeout;

        // check for request params
        if (request.hasOwnProperty('gatewayServlet') && request.gatewayServlet !== null) {
            urlServlet = request.gatewayServlet;
        }
        if (request.hasOwnProperty('gatewayProtocol') && request.gatewayProtocol !== null) {
            urlProtocol = request.gatewayProtocol;
        }
        if (request.hasOwnProperty('portNo') && request.portNo !== null) {
            urlPortNo = request.portNo;
        }
        if (request.hasOwnProperty('portNo') && request.portNo !== null) {
            urlPortNo = request.portNo;
        }
        if (request.hasOwnProperty('gatewayConnectTimeout') && request.gatewayConnectTimeout !== null) {
            connectTimeout = request.gatewayConnectTimeout;
        }
        if (request.hasOwnProperty('gatewayReadTimeout') && request.gatewayReadTimeout !== null) {
            readTimeout = request.gatewayReadTimeout;
        }

        // clear response params
        response = {};

        utils.toXML(request, function(err, requestXML) {
            options = {
                method: "POST",
                uri: urlProtocol + "://" + serverName + urlServlet,
                body: requestXML,
                headers: {
                    'Content-Type': 'text/xml',
                    'User-Agent': serviceSettings.ROCKETGATE_USER_AGENT
                },
                timeout: connectTimeout * 1000
            };

            _request(options, function(err, res, body) {
                var responseCode = null;

                if (err) {
                    console.log('error: ', err);
                    console.log(options);
                } else {
                    utils.fromXML(body, function(err, json) {
                        if (!err && !!json) {
                            response = json;
                            responseCode = json[responseSettings.RESPONSE_CODE];
                        } else {
                            console.log('Impossible to parse body: ', err, { options, body });
                        }
                    });
                }
                if (responseCode === null) {
                    responseCode = "3";
                    response[responseSettings.EXCEPTION] = body;
                    response[responseSettings.RESPONSE_CODE] = responseCode;
                    response[responseSettings.REASON_CODE] = "400";
                }
                callback(responseCode, request, response);
            });
        });

    }

    /**
     * Perform the transaction outlined in a GatewayRequest.
     * @param {[type]}   request  [description]
     * @param {[type]}   response [description]
     * @param {Function} callback [description]
     */
    function performTransaction(request, response, callback) {
        var index = null,
            swapper = null,
            serverName = gatewaySettings.rocketGateHost;

        var url = require('url');
        var fullUrl =  request.gatewayURL;
        var embeddedFieldsToken = request.embeddedFieldsToken;

        fullUrl = fullUrl || embeddedFieldsToken;
        if (fullUrl) {

            var parsedUrl = url.parse(fullUrl, true);
            if (!request.gatewayServer) {
                request.gatewayServer = parsedUrl.host;
            }
            request.gatewayProtocol = parsedUrl.protocol.slice(0, -1);
            request.gatewayPortNo = parsedUrl.port;
            request.gatewayServlet = parsedUrl.path;
        }

        // check for request params
        if (request.hasOwnProperty('gatewayServer') && request.gatewayServer !== null) {
            serverName = [request.gatewayServer];
        }

        // clear failure codes
        if (request.hasOwnProperty('failedServer')) {
            delete request.failedServer;
        }
        if (request.hasOwnProperty('failedResponseCode')) {
            delete request.failedResponseCode;
        }
        if (request.hasOwnProperty('failedReasonCode')) {
            delete request.failedReasonCode;
        }
        if (request.hasOwnProperty('failedGUID')) {
            delete request.failedGUID;
        }

        // if (serverName.length > 1) {
        //     index = Math.floor(Math.random() * (serverName.length + 1));
        //
        //     if (index > 0) {
        //         swapper = serverName[0];
        //         serverName[0] = serverName[index];
        //         serverName[index] = swapper;
        //     }
        // }

        index = 0;
        sendTransaction(serverName[index], request, response, function(responseCode, request, response) {
            if (responseCode == "0") {
                // transaction succeeded
                return callback(true, request, response);
            } else if (responseCode != "3") {
                // transaction failed
                return callback(false, request, response);
            } else {
                // try again
                request.failedServer = serverName[index];
                request.failedResponseCode = response[responseSettings.RESPONSE_CODE];
                request.failedReasonCode = response[responseSettings.REASON_CODE];
                request.failedGUID = response[responseSettings.TRANSACT_ID];

                // if this is the last one to try, send it back
                if (index == serverName.length - 1) {
                    return callback(false, request, response);
                } else {
                    //otherwise, give it one more try
                    index++;
                    sendTransaction(serverName[index], request, response, function(responseCode, request, response) {
                        if (responseCode == "0") {
                            // transaction succeeded
                            return callback(true, request, response);
                        } else {
                            // transaction failed
                            return callback(false, request, response);
                        }
                    });
                }
            }
        });
    }

    /**
     * Send a transaction to a server based upon the reference GUID.
     *
     * @param {Object}   request
     * @param {Object}   response
     * @param {Function} callback
     */
    function performTargetedTransaction(request, response, callback) {

        // clear failure codes
        if (request.hasOwnProperty('failedServer')) {
            delete request.failedServer;
        }
        if (request.hasOwnProperty('failedResponseCode')) {
            delete request.failedResponseCode;
        }
        if (request.hasOwnProperty('failedReasonCode')) {
            delete request.failedReasonCode;
        }
        if (request.hasOwnProperty('failedGUID')) {
            delete request.failedGUID;
        }

        var url = require('url');
        var fullUrl = request.gatewayURL;
        var embeddedFieldsToken = request.embeddedFieldsToken;

        fullUrl = fullUrl || embeddedFieldsToken;
        if (fullUrl) {

            var parsedUrl = url.parse(fullUrl, true);
            if (!request.gatewayServer) {
                request.gatewayServer = parsedUrl.host;
            }
            request.gatewayProtocol = parsedUrl.protocol.slice(0, -1);
            request.gatewayPortNo = parsedUrl.port;
            request.gatewayServlet = parsedUrl.path; // parsed url path contains the query as well
        }


        var referenceGUID = String(request.referenceGUID);
        if (!referenceGUID) {
            response[responseSettings.RESPONSE_CODE] = '4';
            response[responseSettings.REASON_CODE] = "410";

            return callback(false, request, response);
        }

        var siteString = "0x";
        if (referenceGUID.length > 15) {
            siteString += referenceGUID.substring(0,2);
        } else {
            siteString += referenceGUID.substring(0,1);
        }

        var siteNo;
        try {
            siteNo = Number(siteString);
        } catch (e) {
            response[responseSettings.RESPONSE_CODE] = '4';
            response[responseSettings.REASON_CODE] = "410";

            return callback(false, request, response);
        }

        var serverName = gatewaySettings.rocketGateDNS;
        if (request.hasOwnProperty('gatewayServer') && request.gatewayServer) {
            serverName = [request.gatewayServer];
        }

        var separator = serverName.indexOf('.');
        if (separator !== -1) {
            var prefix = serverName.substring(0, separator);
            prefix += "-";
            prefix += siteNo;
            prefix += serverName.substring(separator, serverName.length);
            serverName = prefix;
        }

        sendTransaction(serverName, request, response, function(results, request, response) {
            if (results == '0') {
                callback(true, request, response);
            } else {
                callback(false, request, response);
            }
        });
    }

    /**
     * Add an entry to the XsellQueue.
     *
     * @param {Object}   request
     * @param {Object}   response
     * @param {Function} callback
     */
    function generateXsell(request, response, callback) {
        request.transactionType = "GENERATEXSELL";
        var referenceGUID = request.xsellReferenceXact;

        if (referenceGUID) {
            performTargetedTransaction(request, response, function(results, request, response) {
                callback(results, request, response);
            });
        } else {
            performTransaction(request, response, function(results, request, response) {
                callback(results, request, response);
            });
        }
    }

    /**
     * Perform the confirmation pass that tells the server we have received
     * transaction reply.
     *
     * @param {Object}   request
     * @param {Object}   response
     * @param {Function} callback
     */
    function performConfirmation(request, response, callback) {

        var confirmResponse = Object.create(response),
            confirmGUID = confirmResponse[responseSettings.TRANSACT_ID];

        if (!confirmGUID) {
            response[responseSettings.EXCEPTION] = "BUG-CHECK - Missing confirmation GUID";
            response[responseSettings.RESPONSE_CODE] = "3";
            response[responseSettings.REASON_CODE] = "307";
            callback(false, request, response);
        } else {
            request.transactionType = "CC_CONFIRM";
            request.referenceGUID = confirmGUID;
            performTargetedTransaction(request, confirmResponse, function(results, request, confirmResponse) {
                if (results) {
                    callback(true, request, response);
                } else {
                    setTimeout( function() {
                        performTargetedTransaction(request, confirmResponse, function(results, request, confirmResponse) {
                            if (results) {
                                callback(true, request, response);
                            } else {
                                response[responseSettings.RESPONSE_CODE] = confirmResponse[responseSettings.RESPONSE_CODE];
                                response[responseSettings.REASON_CODE] = confirmResponse[responseSettings.REASON_CODE];
                                callback(false, request, response);
                            }
                        });
                    }, 2000 );
                }
            });
        }
    }

    /**
     * Submit an auth-only transaction to the RocketGate system.
     *
     * @param {Object}   request
     * @param {Object}   response
     * @param {Function} callback
     */
    function performAuthOnly(request, response, callback) {
        request.transactionType = "CC_AUTH";
        var referenceGUID = request.referenceGUID;
        if (referenceGUID) {
            performTargetedTransaction(request, response, function(results, request, response) {
                if (results) {
                    performConfirmation(request, response, function(results, request, response) {
                        callback(results, request, response);
                    });
                } else {
                    callback(results, request, response);
                }
            });
        } else {
            performTransaction(request, response, function(results, request, response) {
                if (results) {
                    performConfirmation(request, response, function(results, request, response) {
                        callback(results, request, response);
                    });
                } else {
                    callback(results, request, response);
                }
            });
        }
    }

    /**
     * Submit a ticket transaction to settle a previous auth-only transaction.
     *
     * @param {Object}   request
     * @param {Object}   response
     * @param {Function} callback
     */
    function performTicket(request, response, callback) {
        request.transactionType = "CC_TICKET";

        performTargetedTransaction(request, response, function(results, request, response) {
            callback(results, request, response);
        });
    }

    /**
     * Submit a complete auth-capture transaction to the RocketGate system. In
     * effect, this method performs a combined auth-only and ticket operation.
     *
     * @param {Object}   request
     * @param {Object}   response
     * @param {Function} callback
     */
    function performPurchase(request, response, callback) {
        request.transactionType = "CC_PURCHASE";
        var referenceGUID = request.referenceGUID;

        if (referenceGUID) {
            performTargetedTransaction(request, response, function(results, request, response) {
                if (results) {
                    performConfirmation(request, response, function(results, request, response) {
                        callback(results, request, response);
                    });
                } else {
                    callback(results, request, response);
                }
            });
        } else {
            performTransaction(request, response, function(results, request, response) {
                if (results) {
                    performConfirmation(request, response, function(results, request, response) {
                        callback(results, request, response);
                    });
                } else {
                    callback(results, request, response);
                }
            });
        }
    }

    /**
     * Submit a credit transaction to the RocketGate system.
     *
     * @param {Object}   request
     * @param {Object}   response
     * @param {Function} callback
     */
    function performCredit(request, response, callback) {
        request.transactionType = "CC_CREDIT";
        var referenceGUID = request.referenceGUID;

        if (referenceGUID) {
            performTargetedTransaction(request, response, function(results, request, response) {
                callback(results, request, response);
            });
        } else {
            performTransaction(request, response, function(results, request, response) {
                callback(results, request, response);
            });
        }
    }

    /**
     * Submit a void transaction for a previous auth-only, ticket, purchase,
     * or credit transaction.
     *
     * @param {Object}   request
     * @param {Object}   response
     * @param {Function} callback
     */
    function performVoid(request, response, callback) {
        request.transactionType = "CC_VOID";

        performTargetedTransaction(request, response, function(results, request, response) {
            callback(results, request, response);
        });
    }

    /**
     * Submit purchase information to the RocketGate system for validation and
     * fraud analysis.
     *
     * @param {Object}   request
     * @param {Object}   response
     * @param {Function} callback
     */
    function performCardScrub(request, response, callback) {
        request.transactionType = "CARDSCRUB";

        performTransaction(request, response, function(results, request, response) {
            callback(results, request, response);
        });
    }

    /**
     * Schedule cancellation of rebilling.
     *
     * @param {Object}   request
     * @param {Object}   response
     * @param {Function} callback
     */
    function performRebillCancel(request, response, callback) {
        request.transactionType = "REBILL_CANCEL";

        performTransaction(request, response, function(results, request, response) {
            callback(results, request, response);
        });
    }

    /**
     * Update price, frequency, cancellation date etc., of a recurring billing.
     *
     * @param {Object}   request
     * @param {Object}   response
     * @param {Function} callback
     */
    function performRebillUpdate(request, response, callback) {
        request.transactionType = "REBILL_UPDATE";

        var amount = request.amount;

        if (amount === null || amount === undefined || parseFloat(amount) <= 0.0) {
            performTransaction(request, response, function(results, request, response) {
                callback(results, request, response);
            });
        } else {
            performTransaction(request, response, function(results) {
                if (results) {
                    performConfirmation(request, response, function(results, request, response) {
                        callback(results, request, response);
                    });
                }
                callback(results, request, response);
            });
        }
    }

    /**
     * Upload card data to the servers.
     *
     * @param {Object}   request
     * @param {Object}   response
     * @param {Function} callback
     */
    function performCardUpload(request, response, callback) {
        request.transactionType = "CARDUPLOAD";

        performTransaction(request, response, function(results, request, response) {
            callback(results, request, response);
        });
    }

    publicAPI = {
        setTestMode: setTestMode,
        setHost: setHost,
        setProtocol: setProtocol,
        setPortNo: setPortNo,
        setServlet: setServlet,
        setConnectTimeout: setConnectTimeout,
        setReadTimeout: setReadTimeout,
        sendTransaction: sendTransaction,
        performTransaction: performTransaction,
        performTargetedTransaction: performTargetedTransaction,
        generateXsell: generateXsell,
        performConfirmation: performConfirmation,
        performAuthOnly: performAuthOnly,
        performTicket: performTicket,
        performPurchase: performPurchase,
        performCredit: performCredit,
        performVoid: performVoid,
        performCardScrub: performCardScrub,
        performRebillCancel: performRebillCancel,
        performRebillUpdate: performRebillUpdate,
        performCardUpload: performCardUpload
    };

    return publicAPI;
}

var exports = module.exports = GatewayService();
