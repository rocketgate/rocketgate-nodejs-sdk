var async = require('async'),
    hashedUrls = require('./lib/hashedUrls'),
    Service = require('./lib/gatewayService'),
    Request = require('./lib/gatewayRequest'),
    responseSettings = require('./config/config').responseSettings,
    gatewayCodes = require('./config/config').gatewayCodes,
    time = Math.round(+new Date() / 1000);

function RocketgateAPI(options) {
    'use strict';

    var publicAPI = {};

    function performAuthOnly(params, callback) {
        if (params) {
            async.waterfall([
                function (callback) {
                    _setupRequest(params, function (err, request) {
                        callback(err, request);
                    });
                },
                function(request, callback) {
                    Service.performAuthOnly(request, {}, function(results, request, response) {
                        callback(null, results, request, response);
                    });
                },
                function (results, request, response, callback) {
                    _parseBillerResponse(response, function(response) {
                        callback(null, results, request, response);
                    });
                }
            ],
            function (err, results, request, response) {
                callback(results, request, response);
            });
        } else {
            throw new Error('RocketgateAPI performAuthOnly requires `params` Object!');
        }
    }

    function performCardUpload(params, callback) {
        if (params) {
            async.waterfall([
                function (callback) {
                    _setupRequest(params, function (err, request) {
                        callback(err, request);
                    });
                },
                function(request, callback) {
                    Service.performCardUpload(request, {}, function(results, request, response) {
                        callback(null, results, request, response);
                    });
                },
                function (results, request, response, callback) {
                    _parseBillerResponse(response, function(response) {
                        callback(null, results, request, response);
                    });
                }
            ],
            function (err, results, request, response) {
                callback(results, request, response);
            });
        } else {
            throw new Error('RocketgateAPI performCardUpload requires `params` Object!');
        }
    }

    function performCardScrub(params, callback) {
        if (params) {
            async.waterfall([
                function (callback) {
                    _setupRequest(params, function (err, request) {
                        callback(err, request);
                    });
                },
                function(request, callback) {
                    Service.performCardScrub(request, {}, function(results, request, response) {
                        callback(null, results, request, response);
                    });
                },
                function (results, request, response, callback) {
                    _parseBillerResponse(response, function(response) {
                        callback(null, results, request, response);
                    });
                }
            ],
            function (err, results, request, response) {
                callback(results, request, response);
            });
        } else {
            throw new Error('RocketgateAPI performCardUpload requires `params` Object!');
        }
    }

    function generateXsell(params, callback) {
        if (params) {
            async.waterfall([
                    function (callback) {
                        _setupRequest(params, function (err, request) {
                            callback(err, request);
                        });
                    },
                    function(request, callback) {
                        Service.generateXsell(request, {}, function(results, request, response) {
                            callback(null, results, request, response);
                        });
                    },
                    function (results, request, response, callback) {
                        _parseBillerResponse(response, function(response) {
                            callback(null, results, request, response);
                        });
                    }
                ],
                function (err, results, request, response) {
                    callback(results, request, response);
                });
        } else {
            throw new Error('RocketgateAPI performXsell requires `params` Object!');
        }
    }

    function performCredit(params, callback) {
        if (params) {
            async.waterfall([
                function (callback) {
                    _setupRequest(params, function (err, request) {
                        callback(err, request);
                    });
                },
                function(request, callback) {
                    Service.performCredit(request, {}, function(results, request, response) {
                        callback(null, results, request, response);
                    });
                },
                function (results, request, response, callback) {
                    _parseBillerResponse(response, function(response) {
                        callback(null, results, request, response);
                    });
                }
            ],
            function (err, results, request, response) {
                callback(results, request, response);
            });
        } else {
            throw new Error('RocketgateAPI performCredit requires `params` Object!');
        }
    }

    function performPurchase(params, callback) {
        if (params) {
            async.waterfall([
                function (callback) {
                    _setupRequest(params, function (err, request) {
                        callback(err, request);
                    });
                },
                function(request, callback) {
                    Service.performPurchase(request, {}, function(results, request, response) {
                        callback(null, results, request, response);
                    });
                },
                function (results, request, response, callback) {
                    _parseBillerResponse(response, function(response) {
                        callback(null, results, request, response);
                    });
                }
            ],
            function (err, results, request, response) {
                callback(results, request, response);
            });
        } else {
            throw new Error('RocketgateAPI performPurchase requires `params` Object!');
        }
    }

    function performRebillCancel(params, callback) {
        if (params) {
            async.waterfall([
                function (callback) {
                    _setupRequest(params, function (err, request) {
                        callback(err, request);
                    });
                },
                function(request, callback) {
                    Service.performRebillCancel(request, {}, function(results, request, response) {
                        callback(null, results, request, response);
                    });
                },
                function (results, request, response, callback) {
                    _parseBillerResponse(response, function(response) {
                        callback(null, results, request, response);
                    });
                }
            ],
            function (err, results, request, response) {
                callback(results, request, response);
            });
        } else {
            throw new Error('RocketgateAPI performRebillCancel requires `params` Object!');
        }
    }

    function performRebillUpdate(params, callback) {
        if (params) {
            async.waterfall([
                function (callback) {
                    _setupRequest(params, function (err, request) {
                        callback(err, request);
                    });
                },
                function(request, callback) {
                    Service.performRebillUpdate(request, {}, function(results, request, response) {
                        callback(null, results, request, response);
                    });
                },
                function (results, request, response, callback) {
                    _parseBillerResponse(response, function(response) {
                        callback(null, results, request, response);
                    });
                }
            ],
            function (err, results, request, response) {
                callback(results, request, response);
            });
        } else {
            throw new Error('RocketgateAPI performPurchase requires `params` Object!');
        }
    }

    function performTicket(params, callback) {
        if (params) {
            async.waterfall([
                function (callback) {
                    _setupRequest(params, function (err, request) {
                        callback(err, request);
                    });
                },
                function(request, callback) {
                    Service.performTicket(request, {}, function(results, request, response) {
                        callback(null, results, request, response);
                    });
                },
                function (results, request, response, callback) {
                    _parseBillerResponse(response, function(response) {
                        callback(null, results, request, response);
                    });
                }
            ],
            function (err, results, request, response) {
                callback(results, request, response);
            });
        } else {
            throw new Error('RocketgateAPI performTicket requires `params` Object!');
        }
    }

    function performVoid(params, callback) {
        if (params) {
            async.waterfall([
                function (callback) {
                    _setupRequest(params, function (err, request) {
                        callback(err, request);
                    });
                },
                function(request, callback) {
                    Service.performVoid(request, {}, function(results, request, response) {
                        callback(null, results, request, response);
                    });
                },
                function (results, request, response, callback) {
                    _parseBillerResponse(response, function(response) {
                        callback(null, results, request, response);
                    });
                }
            ],
            function (err, results, request, response) {
                callback(results, request, response);
            });
        } else {
            throw new Error('RocketgateAPI performVoid requires `params` Object!');
        }
    }

    function createHostedPageUrl(params, callback) {
        hashedUrls.createHostedPageUrl(params, function (err, result) {
            callback(err, result);
        });
    }

    function createEmbeddedFieldsScript(params, callback) {
        hashedUrls.createEmbeddedFieldsScript(params, function (err, result) {
            callback(err, result);
        });
    }

    function _setupRequest(params, callback) {
        var request = new Request();

        for (var paramProp in params) {
            request[paramProp] = params[paramProp];
        }

        if (params.testMode) {
            Service.setTestMode(true, function (err, result) {
                callback(err, request);
            });
        } else {
            callback(null, request);
        }
    }


    function _parseBillerResponse(response, callback) {
        var reasonCode = response.reasonCode;
        response.result = gatewayCodes.reasonCodes[reasonCode];
        callback(response);
    }


    publicAPI = {
        performAuthOnly: performAuthOnly,
        performCardScrub: performCardScrub,
        performCardUpload: performCardUpload,
        performCredit: performCredit,
        performPurchase: performPurchase,
        performRebillCancel: performRebillCancel,
        performRebillUpdate: performRebillUpdate,
        performTicket: performTicket,
        performVoid: performVoid,
        generateXsell: generateXsell,
        createEmbeddedFieldsScript: createEmbeddedFieldsScript,
        createHostedPageUrl: createHostedPageUrl
    };

    return publicAPI;
}

module.exports = RocketgateAPI();
