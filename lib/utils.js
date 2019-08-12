var xml2json = require('xml2json'),
    json2xml = require("json2xml");

var exports = module.exports = {

    toXML: function (params, callback) {
        callback(null, json2xml({ gatewayRequest: params }, { header: true }));
    },
    fromXML: function (xmlDocument, callback) {
        callback(null, JSON.parse(xml2json.toJson(xmlDocument)).gatewayResponse);
    }

};
