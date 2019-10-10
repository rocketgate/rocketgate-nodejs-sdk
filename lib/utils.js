var xml2json = require('xml2json'),
    json2xml = require("json2xml");

var exports = module.exports = {

    toXML: function (params, callback) {
        try {
            callback(null, json2xml({ gatewayRequest: params }, { header: true }));
        } catch (err) {
            callback(err);
        }
    },
    fromXML: function (xmlDocument, callback) {
        try {
            callback(null, JSON.parse(xml2json.toJson(xmlDocument)).gatewayResponse);
        } catch (err) {
            callback(err);
        }
    }

};
